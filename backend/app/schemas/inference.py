from typing import Literal, Optional

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    channel_set: Optional[Literal["chbmit", "tusz"]] = None
    t_high: Optional[float] = None
    t_low: Optional[float] = None
    smooth_window: Optional[int] = None
    min_duration: Optional[int] = None


class SeizureEventOut(BaseModel):
    id: str = Field(description="Unique event identifier")
    start_time: int = Field(description="Event start in seconds from recording start")
    end_time: int = Field(description="Event end in seconds from recording start")
    channels: list[str] = Field(description="Channel names used for detection")
    channel_attention: dict[str, float] = Field(
        description="Per-channel attention weight (mean over event windows)"
    )


class AnalysisResponse(BaseModel):
    recording_id: str
    status: Literal["analyzed", "no_seizures"]
    seizure_events: list[SeizureEventOut] = []


class UploadResponse(BaseModel):
    recording_id: str
    file_name: str
    duration_seconds: float = 0.0
    channel_count: int = 0
    sample_rate: int = 0
    message: str = "Upload successful"


class RecordingStatus(BaseModel):
    recording_id: str
    status: Literal["pending", "analyzing", "analyzed", "no_seizures", "error"]
    error_detail: Optional[str] = None


class ChannelOut(BaseModel):
    label: str
    samples: list[float]
    sample_rate: int
    physical_min: float
    physical_max: float


class WaveformResponse(BaseModel):
    channels: list[ChannelOut]
    duration_seconds: float
    start_date: Optional[str] = None
    patient_info: Optional[str] = None
    sample_rate: int
    start_offset: float = 0.0
