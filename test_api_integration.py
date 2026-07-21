"""
Test script to verify the API is working correctly.
"""

import requests
import json
import time

def test_api():
    base_url = "http://127.0.0.1:5001"

    print("Testing API endpoints...")

    # Test health endpoint
    print("\n1. Testing /health endpoint:")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        print("   PASS: Health endpoint works")
    except Exception as e:
        print(f"   FAIL: Health endpoint failed: {e}")
        return False

    # Test generate endpoint with text
    print("\n2. Testing /generate endpoint with text:")
    try:
        test_text = "show me Q3 revenue"
        response = requests.post(
            f"{base_url}/generate",
            data={"text": test_text}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response keys: {list(data.keys())}")
            print(f"   Spec title: {data.get('spec', {}).get('title')}")
            print(f"   File path: {data.get('file_path')}")

            # Check that we got a valid spec
            assert "spec" in data
            assert "file_path" in data
            assert data["spec"]["title"] == "Results for unknown"  # Since LLM not configured
            print("   PASS: Generate endpoint works")
        else:
            print(f"   FAIL: Request failed: {response.text}")
            return False
    except Exception as e:
        print(f"   FAIL: Generate endpoint failed: {e}")
        return False

    print("\nALL TESTS PASSED!")
    return True

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
        # Run tests
        success = test_api()
        exit(0 if success else 1)
    finally:
        # Clean up
        server_process.terminate()
        server_process.wait()