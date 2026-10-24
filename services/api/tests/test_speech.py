import hashlib
import io
import os
import wave
from pathlib import Path
from subprocess import CompletedProcess

import pytest

from app import speech


def make_wav(*, sample_rate: int = 16000, channels: int = 1, sample_width: int = 2, frames: int = 1600) -> bytes:
    output = io.BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setnchannels(channels)
        writer.setsampwidth(sample_width)
        writer.setframerate(sample_rate)
        writer.writeframes(b"\x00" * frames * channels * sample_width)
    return output.getvalue()


def configure_runtime(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> tuple[Path, Path]:
    binary = tmp_path / ("whisper-cli.exe" if os.name == "nt" else "whisper-cli")
    model = tmp_path / "model.bin"
    binary.write_bytes(b"fake verified binary for unit test")
    model.write_bytes(b"fake model fixture")
    if os.name != "nt":
        binary.chmod(0o755)
    monkeypatch.setenv("CAESAR_WHISPER_CPP_PATH", str(binary))
    monkeypatch.setenv("CAESAR_WHISPER_CPP_SHA256", hashlib.sha256(binary.read_bytes()).hexdigest())
    monkeypatch.setenv("CAESAR_WHISPER_MODEL_PATH", str(model))
    monkeypatch.setenv("CAESAR_WHISPER_MODEL_SHA256", hashlib.sha256(model.read_bytes()).hexdigest())
    return binary, model


def clear_runtime(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "CAESAR_WHISPER_CPP_PATH",
        "CAESAR_WHISPER_CPP_SHA256",
        "CAESAR_WHISPER_MODEL_PATH",
        "CAESAR_WHISPER_MODEL_SHA256",
    ):
        monkeypatch.delenv(key, raising=False)


def test_status_is_unavailable_when_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_runtime(monkeypatch)
    status = speech.get_local_speech_status()
    assert status["available"] is False
    assert status["reason"] == "not_configured"
    assert "No microphone was activated" in status["message"]


def test_status_verifies_binary_and_model_hashes(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    configure_runtime(monkeypatch, tmp_path)
    assert speech.get_local_speech_status() == {
        "available": True,
        "reason": "ready",
        "message": "Verified local speech runtime ready. Audio will be processed on this machine.",
    }


def test_status_rejects_model_checksum_mismatch(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    configure_runtime(monkeypatch, tmp_path)
    monkeypatch.setenv("CAESAR_WHISPER_MODEL_SHA256", "0" * 64)
    status = speech.get_local_speech_status()
    assert status["available"] is False
    assert status["reason"] == "digest_mismatch"


@pytest.mark.parametrize(
    ("options", "message"),
    [
        ({"sample_rate": 48000}, "16 kHz"),
        ({"channels": 2}, "mono"),
        ({"sample_width": 1}, "16-bit"),
        ({"frames": 0}, "greater than zero"),
        ({"frames": 16000 * 31}, "30 seconds"),
    ],
)
def test_wav_validation_rejects_unsupported_audio(options: dict, message: str) -> None:
    with pytest.raises(speech.InvalidAudio, match=message):
        speech.validate_wav_bytes(make_wav(**options))


def test_wav_validation_rejects_non_wav_data() -> None:
    with pytest.raises(speech.InvalidAudio, match="valid PCM WAV"):
        speech.validate_wav_bytes(b"not audio")


def test_wav_validation_rejects_oversized_audio() -> None:
    with pytest.raises(speech.InvalidAudio, match="30-second"):
        speech.validate_wav_bytes(b"x" * (speech.MAX_AUDIO_BYTES + 1))


def test_transcription_uses_fixed_local_args_and_cleans_temp_audio(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    binary, model = configure_runtime(monkeypatch, tmp_path)
    calls: list[dict] = []

    def fake_run(args, **kwargs):
        calls.append({"args": args, "kwargs": kwargs})
        audio_path = Path(args[4])
        assert audio_path.is_file()
        return CompletedProcess(args=args, returncode=0, stdout="  local transcript  \n", stderr="")

    monkeypatch.setattr(speech.subprocess, "run", fake_run)
    result = speech.transcribe_local_wav(make_wav())

    assert result == {
        "transcript": "local transcript",
        "engine": "whisper.cpp",
        "processing": "local",
        "audio_retained": False,
    }
    assert len(calls) == 1
    assert calls[0]["args"] == [
        str(binary), "-m", str(model), "-f", calls[0]["args"][4], "-nt", "-np"
    ]
    assert calls[0]["kwargs"]["shell"] is False
    assert calls[0]["kwargs"]["stdin"] is speech.subprocess.DEVNULL
    assert calls[0]["kwargs"]["timeout"] == 60
    assert not Path(calls[0]["args"][4]).exists()


def test_transcription_never_runs_when_hash_is_wrong(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    configure_runtime(monkeypatch, tmp_path)
    monkeypatch.setenv("CAESAR_WHISPER_CPP_SHA256", "a" * 64)
    def unexpected_run(*args, **kwargs):
        raise AssertionError("unverified binary must not run")
    monkeypatch.setattr(speech.subprocess, "run", unexpected_run)

    with pytest.raises(speech.LocalSpeechUnavailable, match="checksum"):
        speech.transcribe_local_wav(make_wav())


def test_transcription_fails_closed_on_process_error(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    configure_runtime(monkeypatch, tmp_path)
    monkeypatch.setattr(
        speech.subprocess,
        "run",
        lambda *args, **kwargs: CompletedProcess(args=args, returncode=2, stdout="", stderr="sensitive path"),
    )
    with pytest.raises(speech.LocalTranscriptionFailed, match="No cloud fallback"):
        speech.transcribe_local_wav(make_wav())
