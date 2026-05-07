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

export interface ViewerState {
  timeWindow: number;
  timeOffset: number;
  gain: number;
  visibleChannels: Set<string>;
  speed: number;
}

export interface EdfHeader {
  version: string;
  patientId: string;
  recordingId: string;
  startDate: string;
  startTime: string;
  headerBytes: number;
  dataFormat: string;
  numDataRecords: number;
  dataRecordDuration: number;
  numSignals: number;
}

export interface EdfSignalHeader {
  label: string;
  transducerType: string;
  physicalDimension: string;
  physicalMin: number;
  physicalMax: number;
  digitalMin: number;
  digitalMax: number;
  prefiltering: string;
  numSamples: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
