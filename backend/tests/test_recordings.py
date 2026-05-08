import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import TestSessionLocal
from app.db_models import PatientRow, RecordingRow


async def _seed_patient_and_recordings():
    async with TestSessionLocal() as db:
        db.add(PatientRow(
            id="pat1", first_name="Jane", last_name="Smith",
            date_of_birth="1985-01-01", sex="female",
            medical_record_number="MRN-100", created_at="2024-01-01T00:00:00Z",
        ))
        db.add(RecordingRow(
            id="rec1", patient_id="pat1", file_name="test1.edf",
            file_path="/tmp/test1.edf", uploaded_at="2024-01-01T00:00:00Z",
            duration_seconds=60.0, channel_count=19, sample_rate=256,
            status="analyzed", seizure_count=2,
        ))
        db.add(RecordingRow(
            id="rec2", patient_id="pat1", file_name="test2.edf",
            file_path="/tmp/test2.edf", uploaded_at="2024-01-02T00:00:00Z",
            duration_seconds=120.0, channel_count=19, sample_rate=256,
            status="pending", seizure_count=0,
        ))
        await db.commit()


async def test_list_recordings_by_patient(client: AsyncClient):
    await _seed_patient_and_recordings()
    res = await client.get("/api/recordings", params={"patient_id": "pat1"})
    assert res.status_code == 200
    assert len(res.json()) == 2


async def test_get_recording_not_found(client: AsyncClient):
    res = await client.get("/api/recordings/nonexistent")
    assert res.status_code == 404
