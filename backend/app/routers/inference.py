"""Inference router: upload, analyze, and retrieve results."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.db_models import RecordingRow, SeizureEventRow
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


async def _get_recording_or_404(
    recording_id: str, db: AsyncSession,
) -> RecordingRow:
    rec = await db.get(RecordingRow, recording_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")
    return rec


@router.post("/upload", response_model=UploadResponse)
async def upload_recording(
    file: UploadFile,
    patient_id: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Accept an EDF file upload, extract metadata, and persist to DB."""
    if not file.filename or not file.filename.lower().endswith(".edf"):
        raise HTTPException(status_code=400, detail="Only .edf files are accepted")

    recording_id = uuid.uuid4().hex[:12]
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / f"{recording_id}.edf"
    content = await file.read()
    dest.write_bytes(content)

    duration_seconds = 0.0
    channel_count = 0
    sample_rate = 0
    try:
        edf = parse_edf_full(str(dest))
        duration_seconds = edf.duration_seconds
        channel_count = len(edf.channels)
        sample_rate = edf.sample_rate
    except Exception:
        logger.warning("Could not extract EDF metadata for %s", recording_id)

    rec = RecordingRow(
        id=recording_id,
        patient_id=patient_id,
        file_name=file.filename,
        file_path=str(dest),
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        duration_seconds=duration_seconds,
        channel_count=channel_count,
        sample_rate=sample_rate,
        status="pending",
        seizure_count=0,
    )
    db.add(rec)
    await db.commit()

    logger.info("Uploaded %s as recording %s", file.filename, recording_id)
    return UploadResponse(
        recording_id=recording_id,
        file_name=file.filename,
        duration_seconds=duration_seconds,
        channel_count=channel_count,
        sample_rate=sample_rate,
    )


@router.post("/{recording_id}/analyze", response_model=AnalysisResponse)
async def analyze_recording(
    recording_id: str,
    request: Request,
    body: AnalysisRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Run inference + post-processing on an uploaded recording."""
    rec = await _get_recording_or_404(recording_id, db)

    rec.status = "analyzing"
    await db.commit()

    inference_svc = request.app.state.inference_service

    body = body or AnalysisRequest()
    channel_set = body.channel_set or settings.channel_set
    ch_names = CHANNEL_SETS[channel_set]

    try:
        probs, attn_weights = inference_svc.predict_recording(
            rec.file_path,
            channel_set=channel_set,
            batch_size=settings.batch_size,
        )
    except Exception as e:
        rec.status = "error"
        await db.commit()
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

    # Delete any previous events for this recording (re-analysis)
    old_events = await db.execute(
        select(SeizureEventRow).where(SeizureEventRow.recording_id == recording_id)
    )
    for old in old_events.scalars().all():
        await db.delete(old)

    events = get_events(preds)
    seizure_events: list[SeizureEventOut] = []

    for i, (start, end) in enumerate(events):
        event_attn = attn_weights[start:end].mean(axis=0)
        channel_attention = {
            name: round(float(w), 4)
            for name, w in zip(ch_names, event_attn)
        }

        event_id = f"{recording_id}-ev-{i}"
        db.add(SeizureEventRow(
            id=event_id,
            recording_id=recording_id,
            start_time=int(start),
            end_time=int(end),
            channels_json=json.dumps(ch_names),
            channel_attention_json=json.dumps(channel_attention),
        ))

        seizure_events.append(SeizureEventOut(
            id=event_id,
            start_time=int(start),
            end_time=int(end),
            channels=ch_names,
            channel_attention=channel_attention,
        ))

    status = "analyzed" if seizure_events else "no_seizures"
    rec.status = status
    rec.seizure_count = len(seizure_events)
    await db.commit()

    logger.info(
        "Analysis complete for %s: %d events detected",
        recording_id, len(seizure_events),
    )
    return AnalysisResponse(
        recording_id=recording_id,
        status=status,
        seizure_events=seizure_events,
    )


@router.get("/{recording_id}/results", response_model=AnalysisResponse)
async def get_results(recording_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve analysis results for a previously analyzed recording."""
    rec = await _get_recording_or_404(recording_id, db)

    if rec.status not in ("analyzed", "no_seizures"):
        raise HTTPException(
            status_code=409,
            detail=f"Recording status is '{rec.status}'. Run /analyze first.",
        )

    result = await db.execute(
        select(SeizureEventRow)
        .where(SeizureEventRow.recording_id == recording_id)
        .order_by(SeizureEventRow.start_time)
    )

    seizure_events = [
        SeizureEventOut(
            id=row.id,
            start_time=row.start_time,
            end_time=row.end_time,
            channels=json.loads(row.channels_json),
            channel_attention=json.loads(row.channel_attention_json),
        )
        for row in result.scalars().all()
    ]

    return AnalysisResponse(
        recording_id=recording_id,
        status=rec.status,
        seizure_events=seizure_events,
    )


@router.get("/{recording_id}/status", response_model=RecordingStatus)
async def get_status(recording_id: str, db: AsyncSession = Depends(get_db)):
    """Check the current status of a recording."""
    rec = await _get_recording_or_404(recording_id, db)
    return RecordingStatus(recording_id=recording_id, status=rec.status)


@router.get("/{recording_id}/waveform", response_model=WaveformResponse)
async def get_waveform(
    recording_id: str,
    start: float = Query(default=0.0, ge=0, description="Start time in seconds"),
    duration: float | None = Query(default=None, gt=0, description="Duration in seconds (omit for full recording)"),
    db: AsyncSession = Depends(get_db),
):
    """Return EEG channel waveform data for viewer display."""
    rec = await _get_recording_or_404(recording_id, db)

    try:
        edf = parse_edf_full(rec.file_path)
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
