"""EEG utilities: channel mapping, EDF parsing, and window preparation."""

from pathlib import Path

import numpy as np
from scipy.signal import resample_poly
from math import gcd

STANDARD_1020 = [
    'FP1', 'FPZ', 'FP2',
    'AF9', 'AF7', 'AF5', 'AF3', 'AF1', 'AFZ', 'AF2', 'AF4', 'AF6', 'AF8', 'AF10',
    'F9', 'F7', 'F5', 'F3', 'F1', 'FZ', 'F2', 'F4', 'F6', 'F8', 'F10',
    'FT9', 'FT7', 'FC5', 'FC3', 'FC1', 'FCZ', 'FC2', 'FC4', 'FC6', 'FT8', 'FT10',
    'T9', 'T7', 'C5', 'C3', 'C1', 'CZ', 'C2', 'C4', 'C6', 'T8', 'T10',
    'TP9', 'TP7', 'CP5', 'CP3', 'CP1', 'CPZ', 'CP2', 'CP4', 'CP6', 'TP8', 'TP10',
    'P9', 'P7', 'P5', 'P3', 'P1', 'PZ', 'P2', 'P4', 'P6', 'P8', 'P10',
    'PO9', 'PO7', 'PO5', 'PO3', 'PO1', 'POZ', 'PO2', 'PO4', 'PO6', 'PO8', 'PO10',
    'O1', 'OZ', 'O2', 'O9', 'CB1', 'CB2',
    'IZ', 'O10', 'T3', 'T5', 'T4', 'T6', 'M1', 'M2', 'A1', 'A2',
]

CHBMIT_CH_NAMES = [
    'F7', 'T3', 'T5', 'O1', 'F3', 'C3', 'C3', 'O1',
    'F4', 'C4', 'C4', 'O2', 'F8', 'T4', 'T6', 'O2',
    'CZ', 'PZ', 'T5', 'FT9', 'FT10', 'T4', 'T6',
]

TUSZ_CH_NAMES = [
    'FP1', 'FP2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4',
    'O1', 'O2', 'F7', 'F8', 'T3', 'T4', 'T5', 'T6',
    'FZ', 'CZ', 'PZ',
]

CHANNEL_SETS = {
    "chbmit": CHBMIT_CH_NAMES,
    "tusz": TUSZ_CH_NAMES,
}


def get_input_chans(ch_names: list[str]) -> list[int]:
    """Map channel names to learned spatial embedding indices (0 = CLS token)."""
    input_chans = [0]
    for ch_name in ch_names:
        input_chans.append(STANDARD_1020.index(ch_name) + 1)
    return input_chans


def parse_edf(file_path: str | Path) -> tuple[np.ndarray, list[str], int]:
    """Parse an EDF file and return (signals, channel_names, sample_rate).

    Returns
    -------
    signals : ndarray of shape (n_channels, n_samples), float64
    channel_names : list of channel label strings
    sample_rate : int, samples per second (from the first signal)
    """
    import pyedflib

    edf = pyedflib.EdfReader(str(file_path))
    try:
        n_channels = edf.signals_in_file
        all_labels = [edf.getLabel(i).strip().upper() for i in range(n_channels)]
        n_samples = edf.getNSamples()
        sample_rates = [int(edf.getSampleFrequency(i)) for i in range(n_channels)]

        # Keep only EEG channels (same sample count as the first real signal),
        # filtering out annotation/status channels with different lengths.
        primary_n = n_samples[0]
        primary_rate = sample_rates[0]

        keep_idx = [
            i for i in range(n_channels)
            if n_samples[i] == primary_n and sample_rates[i] == primary_rate
        ]

        channel_names = [all_labels[i] for i in keep_idx]
        signals = np.zeros((len(keep_idx), primary_n))
        for out_i, src_i in enumerate(keep_idx):
            signals[out_i, :] = edf.readSignal(src_i)

        sample_rate = primary_rate
    finally:
        edf.close()

    return signals, channel_names, sample_rate


from dataclasses import dataclass, field


@dataclass
class EdfChannelInfo:
    label: str
    samples: np.ndarray
    sample_rate: int
    physical_min: float
    physical_max: float


@dataclass
class EdfData:
    channels: list[EdfChannelInfo]
    duration_seconds: float
    sample_rate: int
    start_date: str | None = None
    patient_info: str | None = None


def parse_edf_full(file_path: str | Path) -> EdfData:
    """Parse an EDF file returning full channel metadata for waveform display.

    Unlike parse_edf(), this returns per-channel physical ranges and
    recording metadata needed by the frontend viewer.
    """
    import pyedflib

    edf = pyedflib.EdfReader(str(file_path))
    try:
        n_channels = edf.signals_in_file
        all_labels = [edf.getLabel(i).strip().upper() for i in range(n_channels)]
        n_samples = edf.getNSamples()
        sample_rates = [int(edf.getSampleFrequency(i)) for i in range(n_channels)]

        primary_n = n_samples[0]
        primary_rate = sample_rates[0]

        keep_idx = [
            i for i in range(n_channels)
            if n_samples[i] == primary_n and sample_rates[i] == primary_rate
        ]

        duration = edf.getFileDuration()
        start_date = edf.getStartdatetime().isoformat() if edf.getStartdatetime() else None
        patient_info = edf.getPatientName() or None

        channels: list[EdfChannelInfo] = []
        for src_i in keep_idx:
            channels.append(EdfChannelInfo(
                label=all_labels[src_i],
                samples=edf.readSignal(src_i).astype(np.float32),
                sample_rate=primary_rate,
                physical_min=float(edf.getPhysicalMinimum(src_i)),
                physical_max=float(edf.getPhysicalMaximum(src_i)),
            ))
    finally:
        edf.close()

    return EdfData(
        channels=channels,
        duration_seconds=float(duration),
        sample_rate=primary_rate,
        start_date=start_date,
        patient_info=patient_info,
    )


def _resample(signal: np.ndarray, from_rate: int, to_rate: int) -> np.ndarray:
    """Resample a 1-D signal from from_rate to to_rate using polyphase filtering."""
    if from_rate == to_rate:
        return signal
    divisor = gcd(from_rate, to_rate)
    up = to_rate // divisor
    down = from_rate // divisor
    return resample_poly(signal, up, down)


def prepare_windows(
    raw_eeg: np.ndarray,
    sample_rate: int,
    target_rate: int = 200,
    window_sec: int = 2,
    stride_sec: int = 1,
    patch_size: int = 200,
) -> np.ndarray:
    """Resample, scale, and slice EEG into overlapping windows.

    Parameters
    ----------
    raw_eeg : (n_channels, n_samples)
    sample_rate : original sample rate
    target_rate : model's expected sample rate (200 Hz)
    window_sec : window duration in seconds
    stride_sec : stride in seconds
    patch_size : temporal patch size for the model

    Returns
    -------
    windows : ndarray of shape (n_windows, n_channels, n_patches, patch_size)
        Ready for torch conversion and model input.
    """
    n_channels, n_samples = raw_eeg.shape

    if sample_rate != target_rate:
        resampled = np.zeros((n_channels, int(n_samples * target_rate / sample_rate)))
        for i in range(n_channels):
            resampled[i] = _resample(raw_eeg[i], sample_rate, target_rate)
        raw_eeg = resampled

    raw_eeg = raw_eeg / 100.0

    window_samples = window_sec * target_rate
    stride_samples = stride_sec * target_rate
    n_total = raw_eeg.shape[1]

    if n_total < window_samples:
        pad_width = window_samples - n_total
        raw_eeg = np.pad(raw_eeg, ((0, 0), (0, pad_width)), mode='constant')
        n_total = window_samples

    n_windows = (n_total - window_samples) // stride_samples + 1
    n_patches = window_samples // patch_size

    windows = np.zeros((n_windows, n_channels, n_patches, patch_size), dtype=np.float32)
    for i in range(n_windows):
        start = i * stride_samples
        segment = raw_eeg[:, start:start + window_samples]
        windows[i] = segment.reshape(n_channels, n_patches, patch_size)

    return windows
