"""Patient CRUD router."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.db_models import PatientRow
from app.schemas.patients import PatientCreate, PatientOut, PatientUpdate

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(body: PatientCreate, db: AsyncSession = Depends(get_db)):
    patient = PatientRow(
        id=uuid.uuid4().hex[:12],
        first_name=body.first_name,
        last_name=body.last_name,
        date_of_birth=body.date_of_birth,
        sex=body.sex,
        medical_record_number=body.medical_record_number,
        notes=body.notes,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return PatientOut.model_validate(patient)


@router.get("", response_model=list[PatientOut])
async def list_patients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PatientRow).order_by(PatientRow.created_at.desc()))
    return [PatientOut.model_validate(row) for row in result.scalars().all()]


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    patient = await db.get(PatientRow, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientOut.model_validate(patient)


@router.put("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
):
    patient = await db.get(PatientRow, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return PatientOut.model_validate(patient)


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    patient = await db.get(PatientRow, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await db.delete(patient)
    await db.commit()
