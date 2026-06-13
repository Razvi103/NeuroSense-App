from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.db_models import PatientRow, RecordingRow

router = APIRouter(tags=["stats"])


class StatsOut(BaseModel):
    total_patients: int
    total_recordings: int
    total_seizures: int
    pending_reviews: int


@router.get("/api/stats", response_model=StatsOut)
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_patients = (await db.execute(
        select(func.count()).select_from(PatientRow)
    )).scalar() or 0

    total_recordings = (await db.execute(
        select(func.count()).select_from(RecordingRow)
    )).scalar() or 0

    total_seizures = (await db.execute(
        select(func.coalesce(func.sum(RecordingRow.seizure_count), 0))
    )).scalar() or 0

    pending_reviews = (await db.execute(
        select(func.count())
        .select_from(RecordingRow)
        .where(RecordingRow.status.in_(["pending", "analyzing"]))
    )).scalar() or 0

    return StatsOut(
        total_patients=total_patients,
        total_recordings=total_recordings,
        total_seizures=total_seizures,
        pending_reviews=pending_reviews,
    )
