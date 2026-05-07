export const EEG_CHANNEL_LABELS = [
  "Fp1", "Fp2",
  "F3", "F4", "F7", "F8", "Fz",
  "C3", "C4", "Cz",
  "T3", "T4", "T5", "T6",
  "P3", "P4", "Pz",
  "O1", "O2",
] as const;

export const CHANNEL_COLORS = [
  "#0f172a", "#1d4ed8", "#4338ca", "#6d28d9",
  "#be185d", "#e11d48", "#b45309", "#0f766e",
  "#0e7490", "#0369a1", "#0f172a", "#1d4ed8",
  "#4338ca", "#6d28d9", "#be185d",
] as const;

export const TIME_WINDOWS = [5, 10, 15, 30] as const;

export const GAIN_PRESETS = [
  { label: "1x", value: 1 },
  { label: "5x", value: 5 },
  { label: "25x", value: 25 },
  { label: "50x", value: 50 },
  { label: "100x", value: 100 },
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
