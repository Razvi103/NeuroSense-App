import pytest
from httpx import AsyncClient


PATIENT_DATA = {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "sex": "male",
    "medical_record_number": "MRN-001",
    "notes": "Test patient",
}


async def test_create_patient(client: AsyncClient):
    res = await client.post("/api/patients", json=PATIENT_DATA)
    assert res.status_code == 201
    data = res.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert "id" in data


async def test_get_patient(client: AsyncClient):
    res = await client.post("/api/patients", json=PATIENT_DATA)
    patient_id = res.json()["id"]

    res = await client.get(f"/api/patients/{patient_id}")
    assert res.status_code == 200
    assert res.json()["medical_record_number"] == "MRN-001"


async def test_update_patient(client: AsyncClient):
    res = await client.post("/api/patients", json=PATIENT_DATA)
    patient_id = res.json()["id"]

    res = await client.put(f"/api/patients/{patient_id}", json={"notes": "Updated notes"})
    assert res.status_code == 200
    assert res.json()["notes"] == "Updated notes"


async def test_delete_patient(client: AsyncClient):
    res = await client.post("/api/patients", json=PATIENT_DATA)
    patient_id = res.json()["id"]

    res = await client.delete(f"/api/patients/{patient_id}")
    assert res.status_code == 204

    res = await client.get(f"/api/patients/{patient_id}")
    assert res.status_code == 404
