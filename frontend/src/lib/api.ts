import type { Patient, Recording, SeizureEvent, EEGData, ChannelData } from "./types";
import { EEG_CHANNEL_LABELS } from "./constants";

const API_BASE = typeof window === "undefined" ? "http://127.0.0.1:8000/api" : "/api";

// Helper to clean messy EDF channel names
function normalizeChannelName(rawLabel: string): string {
  // Remove common prefixes/suffixes
  let clean = rawLabel.toUpperCase()
    .replace("EEG ", "")
    .replace("-LE", "")
    .replace("-REF", "")
    .trim();
  
  // Fix casing to match our standard 19-channel 10-20 system
  // e.g. "FP1" -> "Fp1", "FZ" -> "Fz"
  if (clean === "FP1") return "Fp1";
  if (clean === "FP2") return "Fp2";
  if (clean === "FZ") return "Fz";
  if (clean === "CZ") return "Cz";
  if (clean === "PZ") return "Pz";
  if (clean === "OZ") return "Oz";
  
  return clean;
}

// Convert backend snake_case to frontend camelCase
function mapPatient(p: any): Patient {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    dateOfBirth: p.date_of_birth,
    sex: p.sex,
    medicalRecordNumber: p.medical_record_number,
    notes: p.notes,
    createdAt: p.created_at,
  };
}

function mapRecording(r: any): Recording {
  return {
    id: r.id,
    patientId: r.patient_id,
    fileName: r.file_name,
    uploadedAt: r.uploaded_at,
    durationSeconds: r.duration_seconds,
    channelCount: r.channel_count,
    sampleRate: r.sample_rate,
    status: r.status,
    seizureCount: r.seizure_count,
  };
}

export async function getPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/patients`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(mapPatient);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const res = await fetch(`${API_BASE}/patients/${id}`, { cache: 'no-store' });
  if (!res.ok) return undefined;
  const data = await res.json();
  return mapPatient(data);
}

export async function createPatient(patientData: Omit<Patient, "id" | "createdAt">): Promise<Patient> {
  const res = await fetch(`${API_BASE}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: patientData.firstName,
      last_name: patientData.lastName,
      date_of_birth: patientData.dateOfBirth,
      sex: patientData.sex,
      medical_record_number: patientData.medicalRecordNumber,
      notes: patientData.notes,
    }),
  });
  if (!res.ok) throw new Error("Failed to create patient");
  const data = await res.json();
  return mapPatient(data);
}

export async function getRecordings(): Promise<Recording[]> {
  const res = await fetch(`${API_BASE}/recordings`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(mapRecording);
}

export async function getRecordingsForPatient(patientId: string): Promise<Recording[]> {
  const res = await fetch(`${API_BASE}/recordings?patient_id=${patientId}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(mapRecording);
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  const res = await fetch(`${API_BASE}/recordings/${id}`, { cache: 'no-store' });
  if (!res.ok) return undefined;
  const data = await res.json();
  return mapRecording(data);
}

export async function uploadRecording(file: File, patientId: string): Promise<{ recording_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/recordings/upload?patient_id=${patientId}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function analyzeRecording(recordingId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/recordings/${recordingId}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function getSeizureEvents(recordingId: string): Promise<SeizureEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/recordings/${recordingId}/results`, { cache: 'no-store' });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.seizure_events.map((e: any, i: number) => ({
      id: `${recordingId}-ev-${i}`,
      recordingId,
      startTime: e.start_time,
      endTime: e.end_time,
      channels: e.channels,
      channelAttention: e.channel_attention,
      type: "model",
    }));
  } catch (err) {
    return [];
  }
}

export async function getEEGData(recordingId: string): Promise<EEGData> {
  const res = await fetch(
    `${API_BASE}/recordings/${recordingId}/waveform`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error("Failed to fetch waveform data");
  }
  const data = await res.json();

  const allowedChannels = new Set(EEG_CHANNEL_LABELS);

  const channels: ChannelData[] = data.channels
    .map((ch: { label: string; samples: number[]; sample_rate: number; physical_min: number; physical_max: number }) => {
      return {
        label: normalizeChannelName(ch.label),
        samples: new Float32Array(ch.samples),
        sampleRate: ch.sample_rate,
        physicalMin: ch.physical_min,
        physicalMax: ch.physical_max,
      };
    })
    .filter((ch: ChannelData) => allowedChannels.has(ch.label as any));

  return {
    channels,
    durationSeconds: data.duration_seconds,
    startDate: data.start_date ?? undefined,
    patientInfo: data.patient_info ?? undefined,
  };
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`, { cache: 'no-store' });
  if (!res.ok) {
    return {
      totalPatients: 0,
      totalRecordings: 0,
      totalSeizures: 0,
      pendingReviews: 0,
    };
  }
  const data = await res.json();
  return {
    totalPatients: data.total_patients,
    totalRecordings: data.total_recordings,
    totalSeizures: data.total_seizures,
    pendingReviews: data.pending_reviews,
  };
}
