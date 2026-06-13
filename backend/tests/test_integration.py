import struct
from unittest.mock import MagicMock

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def make_edf_file(num_channels=19, duration_seconds=30, sample_rate=200):
    num_records = duration_seconds
    samples_per_record = sample_rate
    header_bytes = 256 + num_channels * 256

    def pad(s: str, length: int) -> bytes:
        return s.ljust(length).encode("ascii")[:length]

    ch_names = [
        "Fp1", "Fp2", "F3", "F4", "C3", "C4", "P3", "P4",
        "O1", "O2", "F7", "F8", "T3", "T4", "T5", "T6",
        "Fz", "Cz", "Pz",
    ]

    header = bytearray()
    header += pad("0", 8)
    header += pad("integration test", 80)
    header += pad("test recording", 80)
    header += pad("01.01.24", 8)
    header += pad("12.00.00", 8)
    header += pad(str(header_bytes), 8)
    header += pad("", 44)
    header += pad(str(num_records), 8)
    header += pad("1", 8)
    header += pad(str(num_channels), 4)

    for i in range(num_channels):
        header += pad(ch_names[i] if i < len(ch_names) else f"Ch{i+1}", 16)
    for _ in range(num_channels):
        header += pad("AgAgCl electrode", 80)
    for _ in range(num_channels):
        header += pad("uV", 8)
    for _ in range(num_channels):
        header += pad("-3200", 8)
    for _ in range(num_channels):
        header += pad("3200", 8)
    for _ in range(num_channels):
        header += pad("-32768", 8)
    for _ in range(num_channels):
        header += pad("32767", 8)
    for _ in range(num_channels):
        header += pad("HP:0.1Hz LP:75Hz", 80)
    for _ in range(num_channels):
        header += pad(str(samples_per_record), 8)
    for _ in range(num_channels):
        header += pad("", 32)

    assert len(header) == header_bytes

    data = bytearray()
    for rec in range(num_records):
        for ch in range(num_channels):
            for s in range(samples_per_record):
                # Simulate a seizure-like burst in seconds 10-15
                if 10 <= rec < 15:
                    value = int(16000 * np.sin(2 * np.pi * 14 * s / samples_per_record))
                else:
                    value = int(1000 * np.sin(2 * np.pi * 10 * s / samples_per_record))
                data += struct.pack("<h", max(-32768, min(32767, value)))

    return bytes(header + data)


@pytest.fixture
async def integration_client():
    mock_svc = MagicMock()
    mock_svc.model = True
    mock_svc.device = "cpu"

    n_windows = 30
    n_channels = 23  # chbmit channel count
    probs = np.zeros(n_windows)
    probs[10:15] = 0.9  # simulate seizure at windows 10-14
    attn = np.random.rand(n_windows, n_channels).astype(np.float32)
    mock_svc.predict_recording.return_value = (probs, attn)

    app.state.inference_service = mock_svc

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_full_recording_lifecycle(integration_client: AsyncClient):
    client = integration_client

    patient_res = await client.post("/api/patients", json={
        "first_name": "Integration",
        "last_name": "Test",
        "date_of_birth": "1990-01-01",
        "sex": "female",
        "medical_record_number": "INT-001",
    })
    assert patient_res.status_code == 201
    patient_id = patient_res.json()["id"]

    edf_bytes = make_edf_file(num_channels=19, duration_seconds=30, sample_rate=200)
    upload_res = await client.post(
        f"/api/recordings/upload?patient_id={patient_id}",
        files={"file": ("test_recording.edf", edf_bytes, "application/octet-stream")},
    )
    assert upload_res.status_code == 200
    recording_id = upload_res.json()["recording_id"]
    assert recording_id

    status_res = await client.get(f"/api/recordings/{recording_id}/status")
    assert status_res.json()["status"] == "pending"

    analyze_res = await client.post(f"/api/recordings/{recording_id}/analyze")
    assert analyze_res.status_code == 200
    assert analyze_res.json()["status"] in ("analyzed", "no_seizures")

    results_res = await client.get(f"/api/recordings/{recording_id}/results")
    assert results_res.status_code == 200
    results = results_res.json()
    assert "seizure_events" in results
    assert isinstance(results["seizure_events"], list)

    waveform_res = await client.get(f"/api/recordings/{recording_id}/waveform")
    assert waveform_res.status_code == 200
    waveform = waveform_res.json()
    assert len(waveform["channels"]) == 19
    expected_samples = 30 * 200
    assert len(waveform["channels"][0]["samples"]) == expected_samples
