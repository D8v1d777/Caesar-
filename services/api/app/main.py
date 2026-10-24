import ipaddress

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from .metrics import read_metric
from .models import MetricRequest, MetricResult
from .speech import (
    InvalidAudio,
    LocalSpeechUnavailable,
    LocalTranscriptionFailed,
    LocalTranscriptionTimeout,
    MAX_AUDIO_BYTES,
    get_local_speech_status,
    transcribe_local_wav,
)


app = FastAPI(
    title="Caesar Synthetic Demo API",
    version="0.1.0",
    description=(
        "Local-only contract spike. Synthetic fixtures only; no company systems, "
        "identity provider, or AI model is connected."
    ),
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "synthetic-demo"}


@app.post("/v1/demo/metrics", response_model=MetricResult, tags=["demo"])
def get_demo_metric(request: MetricRequest) -> MetricResult:
    return read_metric(request.metric, request.period)


@app.get("/v1/demo/metrics", tags=["demo"])
def metric_contract() -> JSONResponse:
    return JSONResponse(
        {
            "allowed_metrics": ["revenue", "active_customers", "conversion_rate"],
            "allowed_periods": ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"],
            "warning": "Synthetic fixtures only. This endpoint does not expose company data.",
        }
    )


def _require_loopback_client(request: Request) -> None:
    client = request.client
    try:
        is_loopback = client is not None and ipaddress.ip_address(client.host).is_loopback
    except ValueError:
        is_loopback = False
    if not is_loopback:
        raise HTTPException(status_code=403, detail="Local speech endpoints only accept loopback requests.")


@app.get("/v1/local/speech/status", tags=["local-speech"])
def local_speech_status(request: Request) -> dict[str, object]:
    _require_loopback_client(request)
    return get_local_speech_status()


@app.post("/v1/local/speech/transcribe", tags=["local-speech"])
def transcribe_local_speech(request: Request, audio: UploadFile = File(...)) -> dict[str, object]:
    _require_loopback_client(request)
    if request.headers.get("origin") != "http://127.0.0.1:5173":
        raise HTTPException(
            status_code=403,
            detail="Local transcription accepts audio only from the loopback Caesar prototype UI.",
        )
    if audio.content_type not in {"audio/wav", "audio/x-wav"}:
        raise HTTPException(status_code=415, detail="Upload an uncompressed PCM WAV clip.")
    audio_bytes = audio.file.read(MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio clip exceeds the local transcription size limit.")
    try:
        return transcribe_local_wav(audio_bytes)
    except LocalSpeechUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except InvalidAudio as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LocalTranscriptionTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except LocalTranscriptionFailed as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

