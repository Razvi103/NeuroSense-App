"""
ScoreNet: a lightweight postprocessor that refines per-window seizure
probabilities produced by a frozen upstream detector.

Faithful reimplementation of:
    Boonyakitanont et al., "ScoreNet: A Neural Network-Based Post-Processing
    Model for Identifying Epileptic Seizure Onset and Offset in EEGs",
    IEEE TNSRE 2021.

Inference-only subset: model, Toeplitz construction, and hard constraints.
"""

import numpy as np
import torch
import torch.nn as nn


class ScoreNet(nn.Module):
    """ScoreNet onset-offset detector (32 parameters for w=6)."""

    def __init__(self, w=6, gamma=0.5):
        super().__init__()
        self.w = w
        self.gamma = gamma
        filter_len = 2 * w + 1

        self.a1 = nn.Parameter(torch.ones(filter_len))
        self.b1 = nn.Parameter(torch.tensor(-6.0))
        self.a2 = nn.Parameter(torch.ones(filter_len))
        self.b2 = nn.Parameter(torch.tensor(-2.0))
        self.a3 = nn.Parameter(torch.tensor(3.0))
        self.b3 = nn.Parameter(torch.tensor(0.0))
        self.a4 = nn.Parameter(torch.tensor(3.0))
        self.b4 = nn.Parameter(torch.tensor(-1.0))

    def forward(self, Z, n_samples):
        """
        Parameters
        ----------
        Z : (filter_len, total_N) Toeplitz input matrix
        n_samples : list[int]  lengths of each record within Z

        Returns
        -------
        yhat : (total_N,)  refined seizure probabilities
        """
        total_N = Z.shape[1]
        device = Z.device

        candidate = torch.sigmoid(self.a1 @ Z + self.b1)
        score = torch.tanh(self.a2 @ Z + self.b2)

        binary = (candidate >= self.gamma).long()

        value_change = torch.zeros(total_N, dtype=torch.bool, device=device)
        value_change[0] = True
        value_change[1:] = binary[1:] != binary[:-1]

        rec_starts = torch.zeros(total_N, dtype=torch.bool, device=device)
        offsets = torch.tensor(
            np.cumsum([0] + list(n_samples[:-1])),
            dtype=torch.long, device=device,
        )
        rec_starts[offsets] = True

        new_group = value_change | rec_starts
        group_ids = new_group.long().cumsum(0) - 1
        n_groups = group_ids[-1].item() + 1

        ones = torch.ones(total_N, device=device)
        g_sum = torch.zeros(n_groups, device=device).scatter_add_(0, group_ids, score)
        g_cnt = torch.zeros(n_groups, device=device).scatter_add_(0, group_ids, ones)
        g_mean = g_sum / g_cnt

        o_l = torch.sigmoid(self.a3 * g_mean[group_ids] + self.b3)

        yhat = torch.sigmoid(self.a4 * candidate * o_l + self.b4)
        return yhat


def build_toeplitz(z: np.ndarray, w: int) -> np.ndarray:
    """Build the (2w+1, N) Toeplitz input matrix from a 1-D prob array."""
    n = len(z)
    filt_len = 2 * w + 1
    padded = np.concatenate([np.zeros(w, dtype=z.dtype), z, np.zeros(w, dtype=z.dtype)])
    idx = np.arange(n)[None, :] + np.arange(filt_len)[:, None]
    return padded[idx]


def hard_constraints(preds: np.ndarray, min_dur_sec: int = 10) -> np.ndarray:
    """Apply minimum-duration filtering to a binary prediction array.

    Any detected event shorter than min_dur_sec windows (= seconds at
    1 s stride) is removed.  Default 10 s follows ACNS 2021 terminology.
    """
    filtered = preds.copy()
    padded = np.concatenate(([0], filtered, [0]))
    diffs = np.diff(padded)
    starts = np.where(diffs == 1)[0]
    ends = np.where(diffs == -1)[0]
    for s, e in zip(starts, ends):
        if (e - s) < min_dur_sec:
            filtered[s:e] = 0
    return filtered
