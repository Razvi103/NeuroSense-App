export type PatientSex = "male" | "female" | "other";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: PatientSex;
  medicalRecordNumber: string;
  notes?: string;
  createdAt: string;
}

export type RecordingStatus = "pending" | "analyzing" | "analyzed" | "no_seizures" | "flagged";

export interface Recording {
  id: string;
  patientId: string;
  fileName: string;
  uploadedAt: string;
  durationSeconds: number;
  channelCount: number;
  sampleRate: number;
  status: RecordingStatus;
  seizureCount: number;
}

export interface SeizureEvent {
  id: string;
  recordingId: string;
  startTime: number;
  endTime: number;
  channels: string[];
  channelAttention?: Record<string, number>;
  type: "model" | "ground_truth";
}

export interface ChannelData {
  label: string;
  samples: Float32Array;
  sampleRate: number;
  physicalMin: number;
  physicalMax: number;
}

export interface EEGData {
  channels: ChannelData[];
  durationSeconds: number;
  startDate?: string;
  patientInfo?: string;
}
