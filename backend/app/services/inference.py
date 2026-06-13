from pathlib import Path

import numpy as np
import torch
from timm.models import create_model

from app.models import modeling_finetune  # noqa: F401 — registers timm models
from app.models.modeling_finetune import AdversarialNeuralTransformer
from app.utils.eeg import (
    CHANNEL_SETS,
    get_input_chans,
    parse_edf,
    prepare_windows,
)

class InferenceService:

    def __init__(self):
        self.model: AdversarialNeuralTransformer | None = None
        self.device: torch.device = torch.device("cpu")
        self._input_chans_cache: dict[str, list[int]] = {}

    def load_model(
        self,
        checkpoint_path: str | Path,
        model_name: str = "labram_base_patch200_200",
        device: str = "auto",
    ) -> None:
        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        backbone = create_model(
            model_name,
            pretrained=False,
            num_classes=1,
            drop_rate=0.0,
            drop_path_rate=0.1,
            use_mean_pooling=True,
            qkv_bias=False,
            use_rel_pos_bias=False,
            use_abs_pos_emb=True,
            init_values=0.1,
        )

        ckpt = torch.load(str(checkpoint_path), map_location="cpu", weights_only=False)
        state = ckpt["model"]
        clean_state = {k.replace("module.", ""): v for k, v in state.items()}

        disc_keys = [
            k for k in clean_state
            if k.startswith("patient_discriminator") and k.endswith(".weight")
        ]
        num_patients = clean_state[disc_keys[-1]].shape[0]

        model = AdversarialNeuralTransformer(
            backbone, num_patients=num_patients, adv_hidden_dim=512,
        )

        if "seizure_head.weight" in clean_state and "seizure_head.0.weight" not in clean_state:
            model.seizure_head = torch.nn.Linear(backbone.embed_dim, backbone.num_classes)

        model.load_state_dict(clean_state, strict=False)
        model.to(self.device).eval()
        self.model = model

    def get_input_chans(self, channel_set: str) -> list[int]:
        if channel_set not in self._input_chans_cache:
            ch_names = CHANNEL_SETS[channel_set]
            self._input_chans_cache[channel_set] = get_input_chans(ch_names)
        return self._input_chans_cache[channel_set]

    def predict_recording(
        self,
        edf_path: str | Path,
        channel_set: str = "chbmit",
        batch_size: int = 64,
    ) -> tuple[np.ndarray, np.ndarray]:
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        signals, _ch_names, sample_rate = parse_edf(edf_path)

        expected_ch_names = CHANNEL_SETS[channel_set]
        n_expected = len(expected_ch_names)
        signals = signals[:n_expected]

        windows = prepare_windows(signals, sample_rate)
        input_chans = self.get_input_chans(channel_set)

        n_windows = windows.shape[0]
        all_probs = []
        all_attn = []

        for start in range(0, n_windows, batch_size):
            batch = torch.from_numpy(windows[start:start + batch_size]).to(self.device)

            with torch.no_grad(), torch.amp.autocast(self.device.type, enabled=self.device.type == "cuda"):
                logits, attn = self.model.predict(batch, input_chans=input_chans)

            probs = torch.sigmoid(logits).cpu().numpy().squeeze(-1)
            attn_np = attn.cpu().numpy()

            all_probs.append(probs)
            all_attn.append(attn_np)

        return np.concatenate(all_probs), np.concatenate(all_attn)
