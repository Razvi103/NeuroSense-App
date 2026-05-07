import type { Patient, Recording, SeizureEvent, EEGData, ConfidenceFrame } from "./types";
import {
  mockPatients,
  mockRecordings,
  mockSeizureEvents,
  generateMockEEG,
  generateConfidenceTimeline,
} from "./mock-data";

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
  return mockRecordings.find((r) => r.id === id);
}

export async function getSeizureEvents(recordingId: string): Promise<SeizureEvent[]> {
  return mockSeizureEvents.filter((e) => e.recordingId === recordingId);
}

export async function getEEGData(recordingId: string): Promise<EEGData> {
  return generateMockEEG(recordingId);
}

export async function getConfidenceTimeline(
  recordingId: string,
  durationSeconds: number,
): Promise<ConfidenceFrame[]> {
  return generateConfidenceTimeline(recordingId, durationSeconds);
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
