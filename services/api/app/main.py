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
        "Local contract spike. Synthetic fixtures only; no company systems or identity provider "
        "is connected, and no conversational model is configured."
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



@app.middleware("http")
async def protect_local_speech_before_body_parsing(request: Request, call_next):
    # Validate the browser origin and socket peer before Starlette parses a
    # multipart upload. This prevents an untrusted Origin from forcing the
    # upload parser to spool an audio body to temporary storage first.
    if request.url.path in {"/v1/local/speech/status", "/v1/local/speech/transcribe"}:
        try:
            peer_is_loopback = (
                request.client is not None
                and ipaddress.ip_address(request.client.host).is_loopback
            )
        except ValueError:
            peer_is_loopback = False
        if not peer_is_loopback:
            return JSONResponse(
                status_code=403,
                content={"detail": "Local speech endpoints only accept loopback requests."},
            )
        if (
            request.url.path == "/v1/local/speech/transcribe"
            and request.headers.get("origin") != "http://127.0.0.1:5173"
        ):
            return JSONResponse(
                status_code=403,
                content={"detail": "Local transcription accepts audio only from the loopback Caesar prototype UI."},
            )
        content_length = request.headers.get("content-length")
        if request.url.path == "/v1/local/speech/transcribe" and content_length:
            try:
                declared_length = int(content_length)
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length."})
            if declared_length < 0 or declared_length > MAX_AUDIO_BYTES + 65_536:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Audio request exceeds the local transcription size limit."},
                )
    return await call_next(request)

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

