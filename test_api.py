#!/usr/bin/env python
"""
Test the FastAPI endpoint using TestClient.
"""

import sys
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from fastapi.testclient import TestClient
from caesar.api import app

client = TestClient(app)

def test_health():
    print("Testing /health endpoint...")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print("PASS: /health endpoint returns 200 OK")

def test_generate_text():
    print("\nTesting /generate endpoint with text input...")
    test_text = "show me Q3 revenue"
    response = client.post("/generate", data={"text": test_text})
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        assert "spec" in data
        assert "file_path" in data
        spec = data["spec"]
        file_path = data["file_path"]
        print(f"Spec title: {spec.get('title')}")
        print(f"Spec chart_type: {spec.get('chart_type')}")
        print(f"File path: {file_path}")
        # Check that the file exists (the render function should have created it)
        if os.path.exists(file_path):
            print(f"File exists, size: {os.path.getsize(file_path)} bytes")
        else:
            print(f"WARNING: File does not exist at {file_path}")
        # Also check that the spec has a source_label
        assert "source_label" in spec
        print("PASS: Generate endpoint works with text input")
    else:
        print(f"FAIL: {response.status_code} - {response.text}")
        raise AssertionError("Generate endpoint failed")

def test_generate_missing_input():
    print("\nTesting /generate endpoint with missing input...")
    response = client.post("/generate", data={})
    assert response.status_code == 400
    print("PASS: Correctly rejects missing input")

if __name__ == "__main__":
    test_health()
    test_generate_text()
    test_generate_missing_input()
    print("\nAll API tests passed!")