import numpy as np
import pandas as pd


def get_events(binary_arr: np.ndarray) -> list[tuple[int, int]]:
    if len(binary_arr) == 0:
        return []

    padded = np.concatenate(([0], binary_arr, [0]))
    diffs = np.diff(padded)
    starts = np.where(diffs == 1)[0]
    ends = np.where(diffs == -1)[0]

    return list(zip(starts.tolist(), ends.tolist()))


def post_process_probs(
    probs: np.ndarray,
    t_high: float = 0.4,
    t_low: float = 0.2,
    smooth_window: int = 5,
    min_duration: int = 5,
) -> np.ndarray:
    if smooth_window > 1:
        probs_smooth = (
            pd.Series(probs)
            .rolling(window=smooth_window, center=True)
            .mean()
            .fillna(0)
            .values
        )
    else:
        probs_smooth = probs

    preds = np.zeros_like(probs_smooth, dtype=int)
    in_seizure = False

    for i, p in enumerate(probs_smooth):
        if not in_seizure:
            if p >= t_high:
                in_seizure = True
                preds[i] = 1
        else:
            if p >= t_low:
                preds[i] = 1
            else:
                in_seizure = False

    final_preds = preds.copy()
    events = get_events(final_preds)
    for s, e in events:
        if (e - s) < min_duration:
            final_preds[s:e] = 0

    return final_preds
