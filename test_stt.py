#!/usr/bin/env python
"""
Test the stt module.
"""

import sys
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from caesar.stt import transcribe_audio, get_text_input

def test_stt():
    print("Testing STT module...")
    # Test text input passthrough
    test_text = "Hello, this is a test."
    result = get_text_input(test_text)
    assert result == test_text, f"Expected '{test_text}', got '{result}'"
    print("PASS: Text input passthrough works.")

    # Test transcribe_audio with non-existent file
    try:
        transcribe_audio("non_existent_file.wav")
        assert False, "Expected FileNotFoundError"
    except FileNotFoundError as e:
        print(f"PASS: transcribe_audio correctly raises FileNotFoundError: {e}")
    except Exception as e:
        print(f"FAIL: Unexpected error: {e}")
        raise

    # Test that the module loads (we can't test transcription without audio)
    print("PASS: STT module imported successfully.")
    print("Note: Actual transcription test requires an audio file.")

if __name__ == "__main__":
    test_stt()
    print("\nSTT tests completed.")