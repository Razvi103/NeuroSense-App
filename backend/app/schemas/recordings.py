from typing import Optional

from pydantic import BaseModel


class RecordingOut(BaseModel):
    id: str
    patient_id: str
    file_name: str
    uploaded_at: str
    duration_seconds: float
    channel_count: int
    sample_rate: int
    status: str
    seizure_count: int

    model_config = {"from_attributes": True}
