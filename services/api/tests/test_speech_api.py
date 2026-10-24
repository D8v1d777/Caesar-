import io
import wave
from pathlib import Path
from subprocess import CompletedProcess

import pytest
from fastapi.testclient import TestClient

from app import speech
from app.main import app


client = TestClient(app, client=("127.0.0.1", 50000))
ORIGIN = "http://127.0.0.1:5173"


def make_wav(seconds: int = 1) -> bytes:
    output = io.BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(16000)
        writer.writeframes(b"\x00" * (16000 * seconds * 2))
    return output.getvalue()


def test_status_reports_unconfigured_runtime_without_exposing_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "CAESAR_WHISPER_CPP_PATH",
        "CAESAR_WHISPER_CPP_SHA256",
        "CAESAR_WHISPER_MODEL_PATH",
        "CAESAR_WHISPER_MODEL_SHA256",
    ):
        monkeypatch.delenv(key, raising=False)

    response = client.get("/v1/local/speech/status")
    assert response.status_code == 200
    body = response.json()
    assert body["available"] is False
    assert body["reason"] == "not_configured"
    assert "CAESAR_WHISPER_CPP_PATH" in body["message"]
    assert "C:\\" not in body["message"]


def test_transcription_rejects_non_loopback_origin() -> None:
    response = client.post(
        "/v1/local/speech/transcribe",
        headers={"origin": "https://example.com"},
        files={"audio": ("clip.wav", make_wav(), "audio/wav")},
    )
    assert response.status_code == 403


def test_transcription_rejects_wrong_audio_content_type() -> None:
    response = client.post(
        "/v1/local/speech/transcribe",
        headers={"origin": ORIGIN},
        files={"audio": ("clip.wav", make_wav(), "audio/webm")},
    )
    assert response.status_code == 415


def test_transcription_fails_closed_when_runtime_is_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "CAESAR_WHISPER_CPP_PATH",
        "CAESAR_WHISPER_CPP_SHA256",
        "CAESAR_WHISPER_MODEL_PATH",
        "CAESAR_WHISPER_MODEL_SHA256",
    ):
        monkeypatch.delenv(key, raising=False)

    response = client.post(
        "/v1/local/speech/transcribe",
        headers={"origin": ORIGIN},
        files={"audio": ("clip.wav", make_wav(), "audio/wav")},
    )
    assert response.status_code == 503
    assert "No microphone" not in response.json()["detail"]


def test_transcription_returns_local_only_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.main.transcribe_local_wav",
        lambda audio: {
            "transcript": "Show quarterly revenue",
            "engine": "whisper.cpp",
            "processing": "local",
            "audio_retained": False,
        },
    )
    response = client.post(
        "/v1/local/speech/transcribe",
        headers={"origin": ORIGIN},
        files={"audio": ("clip.wav", make_wav(), "audio/wav")},
    )
    assert response.status_code == 200
    assert response.json() == {
        "transcript": "Show quarterly revenue",
        "engine": "whisper.cpp",
        "processing": "local",
        "audio_retained": False,
    }


def test_transcription_rejects_oversized_upload() -> None:
    response = client.post(
        "/v1/local/speech/transcribe",
        headers={"origin": ORIGIN},
        files={"audio": ("clip.wav", b"x" * (speech.MAX_AUDIO_BYTES + 1), "audio/wav")},
    )
    assert response.status_code == 413


def test_non_loopback_client_is_denied(monkeypatch: pytest.MonkeyPatch) -> None:
    remote_client = TestClient(app, client=("203.0.113.15", 50000))
    response = remote_client.get("/v1/local/speech/status")
    assert response.status_code == 403
