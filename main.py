"""
Main application entry point for Caesar - Final version.
"""

import os
import sys
import socket
import webview
import threading
import time
import atexit

# Add the current directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def find_free_port():
    """Find a free port to use for the server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

def main():
    # Import app after modifying sys.path
    from caesar.api import app

    # Find a free port
    port = find_free_port()
    print(f"Using port {port}")

    # Store the server reference for cleanup
    server_thread = None
    server_should_stop = False

    # Start FastAPI server in a background thread using uvicorn
    def run_fastapi():
        import uvicorn
        uvicorn.run(app, host='127.0.0.1', port=port, log_level="error")

    server_thread = threading.Thread(target=run_fastapi, daemon=True)
    server_thread.start()

    # Give the server a moment to start
    time.sleep(1.5)

    # Create the webview window
    window = webview.create_window(
        'Caesar - Data-Grounded Presentation Generator',
        f'http://127.0.0.1:{port}/',
        width=1200,
        height=800,
        resizable=True
    )

    # Start the webview event loop
    webview.start()

    # Cleanup function
    def cleanup():
        global server_should_stop
        server_should_stop = True
        print("Cleaning up...")

    # Register cleanup function
    atexit.register(cleanup)

if __name__ == '__main__':
    main()