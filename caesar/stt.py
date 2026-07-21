import os
from functools import lru_cache

@lru_cache(maxsize=1)
def _get_whisper_model():
    """
    Lazily load the Whisper model on first call.
    Using a tiny model for speed and low resource usage.
    """
    from faster_whisper import WhisperModel
    MODEL_SIZE = "tiny"
    try:
        return WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    except Exception:
        # Fallback to float32 if int8 not available
        return WhisperModel(MODEL_SIZE, device="cpu", compute_type="float32")

def get_text_input(text: str) -> str:
    """
    Passthrough for text input.
    """
    return text.strip()

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe an audio file to text using faster-whisper.

    Args:
        audio_path: Path to the audio file (e.g., .wav, .mp3)

    Returns:
        Transcribed text string.

    Raises:
        FileNotFoundError: If the audio file does not exist.
        RuntimeError: If transcription fails.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    try:
        # Lazily load the model on first use
        model = _get_whisper_model()
        # Transcribe the audio
        segments, info = model.transcribe(audio_path, beam_size=5)
        # Concatenate all segments into a single string
        transcription = " ".join([segment.text for segment in segments])
        return transcription.strip()
    except Exception as e:
        raise RuntimeError(f"Transcription failed: {e}")
