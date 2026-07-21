#!/usr/bin/env python3
"""
Build script for Caesar application using PyInstaller
"""

import os
import sys
import subprocess
import shutil

def build_executable():
    """Build the Caesar application as a standalone executable"""
    print("Building Caesar application...")

    # Clean previous builds
    if os.path.exists("build"):
        shutil.rmtree("build")
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    if os.path.exists("Caesar.spec"):
        os.remove("Caesar.spec")

    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",              # Create a single executable file
        "--windowed",             # Don't show console window (GUI app)
        "--name=Caesar",          # Name of the executable
        "--add-data=data/caesar.db;data",  # Include the database
        "--add-data=frontend/index.html;frontend",  # Include frontend
        "main.py"                 # Main script
    ]

    # Run PyInstaller
    try:
        subprocess.check_call(cmd)
        print("\nBuild successful!")
        print("Executable created: dist/Caesar.exe")
        print("\nTo run the application:")
        print("  dist/Caesar.exe")
    except subprocess.CalledProcessError as e:
        print(f"\nBuild failed with error: {e}")
        return False
    except FileNotFoundError:
        print("\nPyInstaller not found. Please install it first:")
        print("  pip install pyinstaller")
        return False

    return True

if __name__ == "__main__":
    build_executable()