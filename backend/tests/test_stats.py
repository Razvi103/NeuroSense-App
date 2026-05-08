import pytest
from httpx import AsyncClient

from tests.conftest import TestSessionLocal
from app.db_models import PatientRow, RecordingRow


async def test_stats_reflect_database(client: AsyncClient):
    async with TestSessionLocal() as db:
        db.add(PatientRow(
            id="p1", first_name="A", last_name="B",
            date_of_birth="2000-01-01", sex="male",
            medical_record_number="MRN-1", created_at="2024-01-01T00:00:00Z",
        ))
        db.add(RecordingRow(
            id="r1", patient_id="p1", file_name="a.edf",
            file_path="/tmp/a.edf", uploaded_at="2024-01-01T00:00:00Z",
            duration_seconds=30.0, channel_count=19, sample_rate=256,
            status="analyzed", seizure_count=3,
        ))
        db.add(RecordingRow(
            id="r2", patient_id="p1", file_name="b.edf",
            file_path="/tmp/b.edf", uploaded_at="2024-01-02T00:00:00Z",
            duration_seconds=60.0, channel_count=19, sample_rate=256,
            status="pending", seizure_count=0,
        ))
        await db.commit()

    res = await client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_patients"] == 1
    assert data["total_recordings"] == 2
    assert data["total_seizures"] == 3
    assert data["pending_reviews"] == 1
