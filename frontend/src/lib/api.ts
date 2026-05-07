import type { Patient, Recording, SeizureEvent, EEGData, ChannelData } from "./types";
import {
  mockPatients,
  mockRecordings,
  mockSeizureEvents,
  generateMockEEG,
} from "./mock-data";
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

// mock api layer -- swap these functions with real fetch calls when backend is ready

export async function getPatients(): Promise<Patient[]> {
  return mockPatients;
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  return mockPatients.find((p) => p.id === id);
}

export async function getRecordings(): Promise<Recording[]> {
  return mockRecordings;
}

export async function getRecordingsForPatient(patientId: string): Promise<Recording[]> {
  return mockRecordings.filter((r) => r.patientId === patientId);
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  const mock = mockRecordings.find((r) => r.id === id);
  if (mock) return mock;

  // Fallback for real backend IDs since we don't have a GET /recordings/{id} details endpoint yet.
  return {
    id,
    patientId: "p1", // Default to first patient
    fileName: `uploaded_file.edf`,
    uploadedAt: new Date().toISOString(),
    durationSeconds: 1800, // 30 minutes
    channelCount: 19,
    sampleRate: 256,
    status: "analyzed",
    seizureCount: 0, // This will be updated by the actual events length if needed
  };
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
      // fallback to mock if not found in real API
      return mockSeizureEvents.filter((e) => e.recordingId === recordingId);
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
    // fallback to mock if backend is down
    return mockSeizureEvents.filter((e) => e.recordingId === recordingId);
  }
}

export async function getEEGData(recordingId: string): Promise<EEGData> {
  try {
    const res = await fetch(
      `${API_BASE}/recordings/${recordingId}/waveform`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return generateMockEEG(recordingId);
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
  } catch {
    return generateMockEEG(recordingId);
  }
}

export async function getStats() {
  const patients = await getPatients();
  const recordings = await getRecordings();
  const analyzedRecordings = recordings.filter((r) => r.status === "analyzed" || r.status === "flagged");
  const totalSeizures = analyzedRecordings.reduce((sum, r) => sum + r.seizureCount, 0);
  const pendingReviews = recordings.filter((r) => r.status === "pending" || r.status === "analyzing").length;

  return {
    totalPatients: patients.length,
    totalRecordings: recordings.length,
    totalSeizures,
    pendingReviews,
  };
}
