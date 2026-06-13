from pathlib import Path

import numpy as np
import pandas as pd
import torch

from app.models.scorenet import ScoreNet, build_toeplitz, hard_constraints


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


def load_scorenet(path: str | Path, device: torch.device) -> ScoreNet:
    model = ScoreNet()
    state = torch.load(str(path), map_location="cpu", weights_only=False)
    if "model_state_dict" in state:
        model.load_state_dict(state["model_state_dict"])
    else:
        model.load_state_dict(state)
    model.to(device).eval()
    return model


def scorenet_postprocess(
    probs: np.ndarray,
    model: ScoreNet,
    device: torch.device,
    threshold: float = 0.5,
    min_dur_sec: int = 10,
) -> tuple[np.ndarray, np.ndarray]:
    Z = build_toeplitz(probs.astype(np.float32), model.w)
    Z_tensor = torch.from_numpy(Z).to(device)

    with torch.no_grad():
        refined = model(Z_tensor, n_samples=[len(probs)])

    refined_probs = refined.cpu().numpy()
    preds = (refined_probs >= threshold).astype(int)
    preds = hard_constraints(preds, min_dur_sec=min_dur_sec)

    return preds, refined_probs
