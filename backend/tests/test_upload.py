import io
import struct

import pytest
from httpx import AsyncClient


def make_minimal_edf(num_signals=1, duration=1, sample_rate=256):
    """Build a minimal valid EDF binary in memory."""
    num_records = duration
    samples_per_record = sample_rate
    header_bytes = 256 + num_signals * 256

    def pad(s: str, length: int) -> bytes:
        return s.ljust(length).encode("ascii")[:length]

    header = bytearray()
    header += pad("0", 8)
    header += pad("test patient", 80)
    header += pad("test recording", 80)
    header += pad("01.01.24", 8)
    header += pad("00.00.00", 8)
    header += pad(str(header_bytes), 8)
    header += pad("", 44)
    header += pad(str(num_records), 8)
    header += pad("1", 8)
    header += pad(str(num_signals), 4)

    # Signal headers
    for i in range(num_signals):
        header += pad(f"Ch{i+1}", 16)
    for _ in range(num_signals):
        header += pad("", 80)
    for _ in range(num_signals):
        header += pad("uV", 8)
    for _ in range(num_signals):
        header += pad("-3200", 8)
    for _ in range(num_signals):
        header += pad("3200", 8)
    for _ in range(num_signals):
        header += pad("-32768", 8)
    for _ in range(num_signals):
        header += pad("32767", 8)
    for _ in range(num_signals):
        header += pad("", 80)
    for _ in range(num_signals):
        header += pad(str(samples_per_record), 8)
    for _ in range(num_signals):
        header += pad("", 32)

    assert len(header) == header_bytes

    data = bytearray()
    for _ in range(num_records):
        for _ in range(num_signals):
            for s in range(samples_per_record):
                data += struct.pack("<h", s % 100)

    return bytes(header + data)


async def test_upload_invalid_extension(client: AsyncClient):
    res = await client.post(
        "/api/recordings/upload",
        files={"file": ("test.csv", b"not an edf", "text/csv")},
    )
    assert res.status_code == 400


async def test_upload_valid_edf(client: AsyncClient):
    edf_bytes = make_minimal_edf(num_signals=2, duration=1, sample_rate=256)
    res = await client.post(
        "/api/recordings/upload",
        files={"file": ("recording.edf", edf_bytes, "application/octet-stream")},
    )
    assert res.status_code == 200
    data = res.json()
    assert "recording_id" in data
    assert data["file_name"] == "recording.edf"

    status_res = await client.get(f"/api/recordings/{data['recording_id']}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "pending"
