from __future__ import annotations

import hashlib
import io
import os
import re
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Any


MAX_AUDIO_BYTES = 1_100_000
MAX_AUDIO_SECONDS = 30
EXPECTED_SAMPLE_RATE = 16_000
EXPECTED_CHANNELS = 1
EXPECTED_SAMPLE_WIDTH = 2
_SHA256_PATTERN = re.compile(r"^[0-9a-fA-F]{64}$")


class LocalSpeechUnavailable(RuntimeError):
    pass


class InvalidAudio(RuntimeError):
    pass


class LocalTranscriptionTimeout(RuntimeError):
    pass


class LocalTranscriptionFailed(RuntimeError):
    pass


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _verified_path(path_value: str, digest_value: str, *, executable: bool) -> tuple[Path | None, str | None]:
    if not path_value.strip() or not digest_value.strip():
        return None, "not_configured"
    if not Path(path_value).expanduser().is_absolute():
        return None, "invalid_path"
    if not _SHA256_PATTERN.fullmatch(digest_value.strip()):
        return None, "invalid_digest"

    try:
        path = Path(path_value).expanduser().resolve(strict=True)
    except (OSError, RuntimeError):
        return None, "file_missing"

    if not path.is_file() or path.stat().st_size <= 0:
        return None, "file_missing"
    if executable and os.name != "nt" and not os.access(path, os.X_OK):
        return None, "binary_not_executable"

    try:
        actual_digest = _sha256_file(path)
    except OSError:
        return None, "file_unreadable"
    if actual_digest.lower() != digest_value.strip().lower():
        return None, "digest_mismatch"
    return path, None


def get_local_speech_status() -> dict[str, Any]:
    """Report readiness without exposing configured local filesystem paths."""
    binary_value = os.environ.get("CAESAR_WHISPER_CPP_PATH", "")
    binary_digest = os.environ.get("CAESAR_WHISPER_CPP_SHA256", "")
    model_value = os.environ.get("CAESAR_WHISPER_MODEL_PATH", "")
    model_digest = os.environ.get("CAESAR_WHISPER_MODEL_SHA256", "")

    if not all((binary_value.strip(), binary_digest.strip(), model_value.strip(), model_digest.strip())):
        return {
            "available": False,
            "reason": "not_configured",
            "message": (
                "Local speech is not configured. Set the whisper-cli path and SHA-256, "
                "plus the local model path and SHA-256. No microphone was activated."
            ),
        }

    binary_path, binary_error = _verified_path(binary_value, binary_digest, executable=True)
    if binary_error:
        messages = {
            "invalid_path": "The configured local speech executable path must be absolute.",
            "invalid_digest": "The configured speech executable SHA-256 is invalid.",
            "file_missing": "The configured local speech executable was not found.",
            "binary_not_executable": "The configured local speech executable is not executable.",
            "file_unreadable": "The local speech executable could not be verified.",
            "digest_mismatch": "The local speech executable checksum does not match the configured SHA-256.",
            "not_configured": "The local speech executable is not configured.",
        }
        return {"available": False, "reason": binary_error, "message": messages[binary_error]}

    model_path, model_error = _verified_path(model_value, model_digest, executable=False)
    if model_error:
        messages = {
            "invalid_path": "The configured local speech model path must be absolute.",
            "invalid_digest": "The configured speech model SHA-256 is invalid.",
            "file_missing": "The configured local speech model was not found.",
            "binary_not_executable": "The configured local speech model is invalid.",
            "file_unreadable": "The local speech model could not be verified.",
            "digest_mismatch": "The local speech model checksum does not match the configured SHA-256.",
            "not_configured": "The local speech model is not configured.",
        }
        return {"available": False, "reason": model_error, "message": messages[model_error]}

    # Retain no absolute paths in the response. Paths are process configuration,
    # not UI content, and must never be forwarded to a model or proposal.
    assert binary_path is not None and model_path is not None
    return {
        "available": True,
        "reason": "ready",
        "message": "Verified local speech runtime ready. Audio will be processed on this machine.",
    }


def validate_wav_bytes(audio_bytes: bytes) -> None:
    if not audio_bytes:
        raise InvalidAudio("The recorded audio clip is empty.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise InvalidAudio("The audio clip exceeds the 30-second local transcription limit.")

    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as reader:
            if reader.getcomptype() != "NONE":
                raise InvalidAudio("Audio must be uncompressed PCM WAV.")
            if (
                reader.getnchannels() != EXPECTED_CHANNELS
                or reader.getsampwidth() != EXPECTED_SAMPLE_WIDTH
                or reader.getframerate() != EXPECTED_SAMPLE_RATE
            ):
                raise InvalidAudio("Audio must be mono, 16-bit PCM WAV at 16 kHz.")
            frames = reader.getnframes()
            if frames <= 0 or frames > EXPECTED_SAMPLE_RATE * MAX_AUDIO_SECONDS:
                raise InvalidAudio("Audio duration must be greater than zero and no longer than 30 seconds.")
            pcm = reader.readframes(frames)
            if len(pcm) != frames * EXPECTED_CHANNELS * EXPECTED_SAMPLE_WIDTH:
                raise InvalidAudio("The WAV file is incomplete or malformed.")
    except (wave.Error, EOFError) as exc:
        raise InvalidAudio("The audio payload is not a valid PCM WAV file.") from exc


def transcribe_local_wav(audio_bytes: bytes) -> dict[str, Any]:
    """Run a pinned local whisper.cpp binary with fixed arguments and no shell."""
    status = get_local_speech_status()
    if not status["available"]:
        raise LocalSpeechUnavailable(str(status["message"]))

    validate_wav_bytes(audio_bytes)

    binary_path = Path(os.environ["CAESAR_WHISPER_CPP_PATH"]).expanduser().resolve(strict=True)
    model_path = Path(os.environ["CAESAR_WHISPER_MODEL_PATH"]).expanduser().resolve(strict=True)

    with tempfile.TemporaryDirectory(prefix="caesar-local-speech-") as temporary_directory:
        temp_dir = Path(temporary_directory)
        audio_path = temp_dir / "input.wav"
        audio_path.write_bytes(audio_bytes)
        command = [
            str(binary_path),
            "-m", str(model_path),
            "-f", str(audio_path),
            "-nt",
            "-np",
        ]

        try:
            completed = subprocess.run(
                command,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=60,
                check=False,
                shell=False,
                cwd=str(temp_dir),
                env={
                    key: value
                    for key, value in os.environ.items()
                    if key in {"PATH", "SYSTEMROOT", "SystemRoot", "WINDIR", "TEMP", "TMP"}
                },
            )
        except subprocess.TimeoutExpired as exc:
            raise LocalTranscriptionTimeout("Local transcription timed out. Try a shorter clip or a smaller model.") from exc
        except OSError as exc:
            raise LocalTranscriptionFailed("The verified local speech executable could not be started.") from exc

        if completed.returncode != 0:
            raise LocalTranscriptionFailed("The local speech executable returned an error. No cloud fallback was attempted.")

        transcript = completed.stdout.strip()
        if not transcript:
            raise LocalTranscriptionFailed("No speech was recognized in this clip.")

    return {
        "transcript": transcript,
        "engine": "whisper.cpp",
        "processing": "local",
        "audio_retained": False,
    }
