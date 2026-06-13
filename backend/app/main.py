import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers.inference import router as inference_router
from app.routers.patients import router as patients_router
from app.routers.recordings import router as recordings_router
from app.routers.stats import router as stats_router
from app.services.inference import InferenceService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    svc = InferenceService()
    if settings.checkpoint_path.exists():
        svc.load_model(
            checkpoint_path=settings.checkpoint_path,
            model_name=settings.model_name,
            device=settings.device,
        )
    else:
        logger.warning("checkpoint not found at %s", settings.checkpoint_path)
    app.state.inference_service = svc
    yield


app = FastAPI(
    title="NeuroSense API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients_router)
app.include_router(recordings_router)
app.include_router(inference_router)
app.include_router(stats_router)


@app.get("/api/health")
async def health_check():
    has_model = (
        hasattr(app.state, "inference_service")
        and app.state.inference_service.model is not None
    )
    return {
        "status": "ok",
        "model_loaded": has_model,
        "device": str(app.state.inference_service.device) if has_model else None,
    }
