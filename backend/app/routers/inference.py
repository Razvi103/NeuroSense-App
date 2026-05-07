"""Inference router: upload, analyze, and retrieve results."""

import logging
import uuid
from pathlib import Path

import numpy as np
from fastapi import APIRouter, HTTPException, Request, UploadFile

from app.config import settings
from fastapi import Query

from app.schemas.inference import (
    AnalysisRequest,
    AnalysisResponse,
    ChannelOut,
    RecordingStatus,
    SeizureEventOut,
    UploadResponse,
    WaveformResponse,
)
from app.services.postprocessing import (
    get_events,
    load_scorenet,
    post_process_probs,
    scorenet_postprocess,
)
from app.utils.eeg import CHANNEL_SETS, parse_edf_full

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recordings", tags=["recordings"])

# In-memory stores (will be replaced by a database later)
_recordings: dict[str, dict] = {}
_results: dict[str, AnalysisResponse] = {}


@router.post("/upload", response_model=UploadResponse)
async def upload_recording(file: UploadFile, patient_id: str = ""):
    """Accept an EDF file upload and store it on disk."""
    if not file.filename or not file.filename.lower().endswith(".edf"):
        raise HTTPException(status_code=400, detail="Only .edf files are accepted")

    recording_id = uuid.uuid4().hex[:12]
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / f"{recording_id}.edf"
    content = await file.read()
    dest.write_bytes(content)

    _recordings[recording_id] = {
        "file_path": str(dest),
        "file_name": file.filename,
        "patient_id": patient_id,
        "status": "pending",
    }

    logger.info("Uploaded %s as recording %s", file.filename, recording_id)
    return UploadResponse(recording_id=recording_id, file_name=file.filename)


@router.post("/{recording_id}/analyze", response_model=AnalysisResponse)
async def analyze_recording(
    recording_id: str,
    request: Request,
    body: AnalysisRequest | None = None,
):
    """Run inference + post-processing on an uploaded recording."""
    if recording_id not in _recordings:
        raise HTTPException(status_code=404, detail="Recording not found")

    rec = _recordings[recording_id]
    rec["status"] = "analyzing"

    inference_svc = request.app.state.inference_service

    body = body or AnalysisRequest()
    channel_set = body.channel_set or settings.channel_set
    ch_names = CHANNEL_SETS[channel_set]

    try:
        probs, attn_weights = inference_svc.predict_recording(
            rec["file_path"],
            channel_set=channel_set,
            batch_size=settings.batch_size,
        )
    except Exception as e:
        rec["status"] = "error"
        logger.exception("Inference failed for %s", recording_id)
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    if body.postprocessing == "scorenet" and settings.scorenet_path:
        sn_model = load_scorenet(settings.scorenet_path, inference_svc.device)
        preds, _ = scorenet_postprocess(
            probs, sn_model, inference_svc.device,
            threshold=body.scorenet_threshold,
            min_dur_sec=body.scorenet_min_dur,
        )
    else:
        preds = post_process_probs(
            probs,
            t_high=body.t_high if body.t_high is not None else settings.t_high,
            t_low=body.t_low if body.t_low is not None else settings.t_low,
            smooth_window=body.smooth_window if body.smooth_window is not None else settings.smooth_window,
            min_duration=body.min_duration if body.min_duration is not None else settings.min_duration,
        )

    events = get_events(preds)
    seizure_events = []

    for start, end in events:
        event_attn = attn_weights[start:end].mean(axis=0)
        channel_attention = {
            name: round(float(w), 4)
            for name, w in zip(ch_names, event_attn)
        }

        seizure_events.append(SeizureEventOut(
            start_time=int(start),
            end_time=int(end),
            channels=ch_names,
            channel_attention=channel_attention,
        ))

    status = "analyzed" if seizure_events else "no_seizures"
    rec["status"] = status

    response = AnalysisResponse(
        recording_id=recording_id,
        status=status,
        seizure_events=seizure_events,
    )
    _results[recording_id] = response

    logger.info(
        "Analysis complete for %s: %d events detected",
        recording_id, len(seizure_events),
    )
    return response


@router.get("/{recording_id}/results", response_model=AnalysisResponse)
async def get_results(recording_id: str):
    """Retrieve analysis results for a previously analyzed recording."""
    if recording_id not in _results:
        if recording_id in _recordings:
            status = _recordings[recording_id]["status"]
            raise HTTPException(
                status_code=409,
                detail=f"Recording status is '{status}'. Run /analyze first.",
            )
        raise HTTPException(status_code=404, detail="Recording not found")

    return _results[recording_id]


@router.get("/{recording_id}/status", response_model=RecordingStatus)
async def get_status(recording_id: str):
    """Check the current status of a recording."""
    if recording_id not in _recordings:
        raise HTTPException(status_code=404, detail="Recording not found")

    rec = _recordings[recording_id]
    return RecordingStatus(
        recording_id=recording_id,
        status=rec["status"],
    )


@router.get("/{recording_id}/waveform", response_model=WaveformResponse)
async def get_waveform(
    recording_id: str,
    start: float = Query(default=0.0, ge=0, description="Start time in seconds"),
    duration: float | None = Query(default=None, gt=0, description="Duration in seconds (omit for full recording)"),
):
    """Return EEG channel waveform data for viewer display.

    Supports optional time-windowing via start/duration query params
    to avoid sending entire multi-hour recordings in one response.
    """
    if recording_id not in _recordings:
        raise HTTPException(status_code=404, detail="Recording not found")

    rec = _recordings[recording_id]
    file_path = rec["file_path"]

    try:
        edf = parse_edf_full(file_path)
    except Exception as e:
        logger.exception("Failed to parse EDF for %s", recording_id)
        raise HTTPException(status_code=500, detail=f"Failed to read EDF: {e}")

    start_sample = int(start * edf.sample_rate)

    if duration is not None:
        end_sample = int((start + duration) * edf.sample_rate)
        actual_duration = duration
    else:
        end_sample = None
        actual_duration = edf.duration_seconds - start

    channels_out: list[ChannelOut] = []
    for ch in edf.channels:
        sliced = ch.samples[start_sample:end_sample]
        channels_out.append(ChannelOut(
            label=ch.label,
            samples=sliced.tolist(),
            sample_rate=ch.sample_rate,
            physical_min=ch.physical_min,
            physical_max=ch.physical_max,
        ))

    return WaveformResponse(
        channels=channels_out,
        duration_seconds=actual_duration,
        start_date=edf.start_date,
        patient_info=edf.patient_info,
        sample_rate=edf.sample_rate,
        start_offset=start,
    )
