"""SQLAlchemy ORM models for patients, recordings, and seizure events."""

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PatientRow(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(12), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    date_of_birth: Mapped[str] = mapped_column(String(10))
    sex: Mapped[str] = mapped_column(String(10))
    medical_record_number: Mapped[str] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(30))


class RecordingRow(Base):
    __tablename__ = "recordings"

    id: Mapped[str] = mapped_column(String(12), primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(12), ForeignKey("patients.id"))
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    uploaded_at: Mapped[str] = mapped_column(String(30))
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    channel_count: Mapped[int] = mapped_column(Integer, default=0)
    sample_rate: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    seizure_count: Mapped[int] = mapped_column(Integer, default=0)


class SeizureEventRow(Base):
    __tablename__ = "seizure_events"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    recording_id: Mapped[str] = mapped_column(String(12), ForeignKey("recordings.id"))
    start_time: Mapped[int] = mapped_column(Integer)
    end_time: Mapped[int] = mapped_column(Integer)
    channels_json: Mapped[str] = mapped_column(Text)
    channel_attention_json: Mapped[str] = mapped_column(Text)
