export const EEG_CHANNEL_LABELS = [
  "Fp1", "Fp2",
  "F3", "F4", "F7", "F8", "Fz",
  "C3", "C4", "Cz",
  "T3", "T4", "T5", "T6",
  "P3", "P4", "Pz",
  "O1", "O2",
] as const;

export const CHANNEL_COLORS = [
  "#22d3ee", "#38bdf8", "#818cf8", "#a78bfa",
  "#c084fc", "#e879f9", "#f472b6", "#fb7185",
  "#f97316", "#facc15", "#a3e635", "#4ade80",
  "#34d399", "#2dd4bf", "#22d3ee", "#38bdf8",
  "#818cf8", "#a78bfa", "#c084fc",
] as const;

export const TIME_WINDOWS = [10, 20, 30, 60] as const;

export const GAIN_PRESETS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "5x", value: 5 },
  { label: "10x", value: 10 },
] as const;

export const EEG_BANDS = {
  delta: { min: 0.5, max: 4 },
  theta: { min: 4, max: 8 },
  alpha: { min: 8, max: 13 },
  beta: { min: 13, max: 30 },
  gamma: { min: 30, max: 100 },
} as const;

export const DEFAULT_SAMPLE_RATE = 256;

export const CONFIDENCE_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f43f5e",
} as const;
