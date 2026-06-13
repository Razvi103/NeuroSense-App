from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


_BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = {"env_prefix": "NEUROSENSE_"}

    checkpoint_path: Path = _BACKEND_DIR / "checkpoints" / "checkpoint-best.pth"
    device: Literal["auto", "cpu", "cuda"] = "auto"
    channel_set: Literal["chbmit", "tusz"] = "chbmit"
    upload_dir: Path = _BACKEND_DIR / "uploads"
    model_name: str = "labram_base_patch200_200"

    t_high: float = 0.4
    t_low: float = 0.2
    smooth_window: int = 5
    min_duration: int = 5

    batch_size: int = 64

    database_url: str = f"sqlite+aiosqlite:///{_BACKEND_DIR / 'data' / 'neurosense.db'}"

    frontend_origin: str = "http://localhost:3000"


settings = Settings()
