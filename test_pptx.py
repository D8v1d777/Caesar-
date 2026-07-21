"""
Test script to verify the generated PPTX file is valid.
"""

import os
import time
import requests
from pptx import Presentation

def test_generated_pptx():
    base_url = "http://127.0.0.1:5001"

    print("Testing generated PPTX file...")

    # Generate a presentation
    print("\n1. Generating presentation:")
    try:
        test_text = "show me Q3 revenue"
        response = requests.post(
            f"{base_url}/generate",
            data={"text": test_text}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            file_path = data.get('file_path')
            print(f"   File path: {file_path}")

            # Check if file exists
            if os.path.exists(file_path):
                print(f"   File size: {os.path.getsize(file_path)} bytes")

                # Try to open the presentation with python-pptx
                try:
                    prs = Presentation(file_path)
                    print(f"   Number of slides: {len(prs.slides)}")
                    print("   PASS: Generated PPTX file is valid")
                    return True
                except Exception as e:
                    print(f"   FAIL: Could not open PPTX file: {e}")
                    return False
            else:
                print("   FAIL: Generated file does not exist")
                return False
        else:
            print(f"   FAIL: Request failed: {response.text}")
            return False
    except Exception as e:
        print(f"   FAIL: Error generating presentation: {e}")
        return False

if __name__ == "__main__":
    # Start the server in the background
    import subprocess
    import sys

    # Start server
    server_process = subprocess.Popen([
        sys.executable, "-c",
        "import uvicorn; from caesar.api import app; uvicorn.run(app, host='127.0.0.1', port=5001, log_level='warning')"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Wait for server to start
    time.sleep(2)

    try:
        # Run test
        success = test_generated_pptx()
        exit(0 if success else 1)
    finally:
        # Clean up
        server_process.terminate()
        server_process.wait()