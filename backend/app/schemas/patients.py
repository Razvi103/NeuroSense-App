from typing import Literal, Optional

from pydantic import BaseModel


class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    sex: Literal["male", "female", "other"]
    medical_record_number: str
    notes: Optional[str] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    sex: Optional[Literal["male", "female", "other"]] = None
    medical_record_number: Optional[str] = None
    notes: Optional[str] = None


class PatientOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: str
    sex: str
    medical_record_number: str
    notes: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}
