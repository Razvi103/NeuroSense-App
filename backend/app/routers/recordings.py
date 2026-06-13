from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.db_models import RecordingRow
from app.schemas.recordings import RecordingOut

router = APIRouter(prefix="/api/recordings", tags=["recordings"])


@router.get("", response_model=list[RecordingOut])
async def list_recordings(
    patient_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RecordingRow).order_by(RecordingRow.uploaded_at.desc())
    if patient_id:
        stmt = stmt.where(RecordingRow.patient_id == patient_id)
    result = await db.execute(stmt)
    return [RecordingOut.model_validate(row) for row in result.scalars().all()]


@router.get("/{recording_id}", response_model=RecordingOut)
async def get_recording(recording_id: str, db: AsyncSession = Depends(get_db)):
    rec = await db.get(RecordingRow, recording_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")
    return RecordingOut.model_validate(rec)
