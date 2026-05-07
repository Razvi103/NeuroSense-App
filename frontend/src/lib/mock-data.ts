import type {
  Patient,
  Recording,
  SeizureEvent,
  ChannelData,
  EEGData,
} from "./types";
import { EEG_CHANNEL_LABELS } from "./constants";

export const mockPatients: Patient[] = [
  {
    id: "p1",
    firstName: "Maria",
    lastName: "Ionescu",
    dateOfBirth: "1985-03-12",
    sex: "female",
    medicalRecordNumber: "MRN-2024-0401",
    notes: "History of focal epilepsy, left temporal lobe",
    createdAt: "2025-11-10T08:30:00Z",
  },
  {
    id: "p2",
    firstName: "Andrei",
    lastName: "Popescu",
    dateOfBirth: "1972-07-25",
    sex: "male",
    medicalRecordNumber: "MRN-2024-0402",
    notes: "Generalized tonic-clonic seizures, on Levetiracetam",
    createdAt: "2025-11-15T10:15:00Z",
  },
  {
    id: "p3",
    firstName: "Elena",
    lastName: "Dumitrescu",
    dateOfBirth: "1998-01-08",
    sex: "female",
    medicalRecordNumber: "MRN-2024-0403",
    createdAt: "2025-12-01T14:20:00Z",
  },
  {
    id: "p4",
    firstName: "Cristian",
    lastName: "Radulescu",
    dateOfBirth: "1960-11-30",
    sex: "male",
    medicalRecordNumber: "MRN-2024-0404",
    notes: "Post-stroke epilepsy monitoring",
    createdAt: "2026-01-05T09:00:00Z",
  },
  {
    id: "p5",
    firstName: "Ana",
    lastName: "Stoica",
    dateOfBirth: "2005-06-14",
    sex: "female",
    medicalRecordNumber: "MRN-2024-0405",
    notes: "Juvenile absence epilepsy",
    createdAt: "2026-02-18T11:45:00Z",
  },
];

export const mockRecordings: Recording[] = [
  {
    id: "r1",
    patientId: "p1",
    fileName: "maria_ionescu_2025-12-01.edf",
    uploadedAt: "2025-12-01T09:00:00Z",
    durationSeconds: 1800,
    channelCount: 19,
    sampleRate: 256,
    status: "analyzed",
    seizureCount: 3,
  },
  {
    id: "r2",
    patientId: "p1",
    fileName: "maria_ionescu_2026-01-15.edf",
    uploadedAt: "2026-01-15T14:30:00Z",
    durationSeconds: 3600,
    channelCount: 19,
    sampleRate: 256,
    status: "flagged",
    seizureCount: 5,
  },
  {
    id: "r3",
    patientId: "p2",
    fileName: "andrei_popescu_2026-02-10.edf",
    uploadedAt: "2026-02-10T08:15:00Z",
    durationSeconds: 2400,
    channelCount: 19,
    sampleRate: 256,
    status: "analyzed",
    seizureCount: 1,
  },
  {
    id: "r4",
    patientId: "p3",
    fileName: "elena_dumitrescu_2026-03-01.edf",
    uploadedAt: "2026-03-01T16:00:00Z",
    durationSeconds: 1200,
    channelCount: 19,
    sampleRate: 256,
    status: "pending",
    seizureCount: 0,
  },
  {
    id: "r5",
    patientId: "p4",
    fileName: "cristian_radulescu_2026-03-20.edf",
    uploadedAt: "2026-03-20T10:45:00Z",
    durationSeconds: 5400,
    channelCount: 19,
    sampleRate: 256,
    status: "analyzing",
    seizureCount: 0,
  },
  {
    id: "r6",
    patientId: "p5",
    fileName: "ana_stoica_2026-04-05.edf",
    uploadedAt: "2026-04-05T13:20:00Z",
    durationSeconds: 1800,
    channelCount: 19,
    sampleRate: 256,
    status: "analyzed",
    seizureCount: 2,
  },
];

export const mockSeizureEvents: SeizureEvent[] = [
  { id: "s1", recordingId: "r1", startTime: 120, endTime: 135, channels: ["F7", "T3", "T5"], type: "model", channelAttention: {"F7": 0.45, "T3": 0.35, "T5": 0.20} },
  { id: "s2", recordingId: "r1", startTime: 450, endTime: 468, channels: ["F7", "T3"], type: "model", channelAttention: {"F7": 0.60, "T3": 0.40} },
  { id: "s3", recordingId: "r1", startTime: 1200, endTime: 1215, channels: ["T3", "T5", "P3"], type: "model", channelAttention: {"T3": 0.50, "T5": 0.30, "P3": 0.20} },
  { id: "s1g", recordingId: "r1", startTime: 118, endTime: 137, channels: ["F7", "T3", "T5"], type: "ground_truth" },
  { id: "s2g", recordingId: "r1", startTime: 448, endTime: 470, channels: ["F7", "T3"], type: "ground_truth" },
  { id: "s3g", recordingId: "r1", startTime: 1198, endTime: 1218, channels: ["T3", "T5", "P3", "O1"], type: "ground_truth" },
  { id: "s4", recordingId: "r2", startTime: 60, endTime: 78, channels: ["Fp1", "F3", "F7"], type: "model", channelAttention: {"Fp1": 0.40, "F3": 0.35, "F7": 0.25} },
  { id: "s5", recordingId: "r2", startTime: 300, endTime: 320, channels: ["F7", "T3", "T5"], type: "model", channelAttention: {"F7": 0.55, "T3": 0.30, "T5": 0.15} },
  { id: "s6", recordingId: "r2", startTime: 800, endTime: 830, channels: ["T3", "C3", "P3"], type: "model", channelAttention: {"T3": 0.45, "C3": 0.40, "P3": 0.15} },
  { id: "s7", recordingId: "r2", startTime: 1500, endTime: 1518, channels: ["T5", "P3", "O1"], type: "model", channelAttention: {"T5": 0.50, "P3": 0.30, "O1": 0.20} },
  { id: "s8", recordingId: "r2", startTime: 2700, endTime: 2725, channels: ["F7", "T3", "T5", "P3"], type: "model", channelAttention: {"F7": 0.35, "T3": 0.30, "T5": 0.20, "P3": 0.15} },
  { id: "s9", recordingId: "r3", startTime: 900, endTime: 920, channels: ["C3", "C4", "Cz"], type: "model", channelAttention: {"C3": 0.40, "C4": 0.35, "Cz": 0.25} },
  { id: "s10", recordingId: "r6", startTime: 200, endTime: 212, channels: ["Fz", "Cz", "Pz"], type: "model", channelAttention: {"Fz": 0.45, "Cz": 0.35, "Pz": 0.20} },
  { id: "s11", recordingId: "r6", startTime: 1100, endTime: 1115, channels: ["Fz", "Cz", "Pz"], type: "model", channelAttention: {"Fz": 0.50, "Cz": 0.30, "Pz": 0.20} },
];

function generateEegSignal(
  durationSeconds: number,
  sampleRate: number,
  channelIndex: number,
  seizureEvents: SeizureEvent[],
): Float32Array {
  const numSamples = durationSeconds * sampleRate;
  const samples = new Float32Array(numSamples);

  const baseFreqs = [
    { freq: 1.5, amp: 25 },  // delta
    { freq: 6, amp: 15 },    // theta
    { freq: 10, amp: 20 },   // alpha
    { freq: 20, amp: 8 },    // beta
  ];

  const phaseOffset = channelIndex * 0.7;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = 0;

    for (const { freq, amp } of baseFreqs) {
      value += amp * Math.sin(2 * Math.PI * freq * t + phaseOffset);
    }

    // add some noise
    value += (Math.random() - 0.5) * 10;

    // amplify during seizure events
    const isSeizure = seizureEvents.some(
      (e) => t >= e.startTime && t <= e.endTime,
    );
    if (isSeizure) {
      value *= 2.5;
      value += 40 * Math.sin(2 * Math.PI * 14 * t) + 30 * Math.sin(2 * Math.PI * 25 * t + phaseOffset);
    }

    samples[i] = value;
  }

  return samples;
}

export function generateMockEEG(recordingId: string): EEGData {
  let recording = mockRecordings.find((r) => r.id === recordingId);
  if (!recording) {
    // Generate a fallback recording object for real backend IDs
    recording = {
      id: recordingId,
      patientId: "p1",
      fileName: `uploaded_file.edf`,
      uploadedAt: new Date().toISOString(),
      durationSeconds: 1800,
      channelCount: 19,
      sampleRate: 256,
      status: "analyzed",
      seizureCount: 0,
    };
  }

  const events = mockSeizureEvents.filter(
    (e) => e.recordingId === recordingId && e.type === "model",
  );

  const channels: ChannelData[] = EEG_CHANNEL_LABELS.map((label, i) => {
    const channelEvents = events.filter((e) => e.channels.includes(label));
    return {
      label,
      samples: generateEegSignal(
        recording.durationSeconds,
        recording.sampleRate,
        i,
        channelEvents,
      ),
      sampleRate: recording.sampleRate,
      physicalMin: -200,
      physicalMax: 200,
    };
  });

  return {
    channels,
    durationSeconds: recording.durationSeconds,
    startDate: recording.uploadedAt,
  };
}
