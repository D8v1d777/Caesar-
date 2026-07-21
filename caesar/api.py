"""
FastAPI application for the Caesar service.
"""

import os
import uuid
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional

OUTPUT_DIR = "generated_slides"

# Import our modules
from .stt import transcribe_audio, get_text_input
from .llm_client import parse_intent
from .data_access import get_grounded_data
from .llm_client import generate_slide_spec
from .render import render_slide

app = FastAPI(title="Caesar API", description="Generate data-grounded slides from text or audio")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.post("/generate")
async def generate_slide(
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None)
):
    """
    Generate a slide from text or audio input.
    Either `text` or `audio` must be provided.
    """
    # Get the input text
    input_text = None
    if text is not None:
        input_text = get_text_input(text)
    elif audio is not None:
        # Save the uploaded file to a temporary location
        temp_dir = "temp_audio"
        os.makedirs(temp_dir, exist_ok=True)
        # Use a unique filename to avoid conflicts
        temp_filename = f"{uuid.uuid4()}_{audio.filename}"
        temp_path = os.path.join(temp_dir, temp_filename)
        # Write the uploaded file
        contents = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
        try:
            # Transcribe the audio
            input_text = transcribe_audio(temp_path)
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            # Remove the temp directory if empty
            if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                os.rmdir(temp_dir)
    else:
        raise HTTPException(status_code=400, detail="Either 'text' or 'audio' must be provided")

    if not input_text or not input_text.strip():
        raise HTTPException(status_code=400, detail="No text provided after processing input")

    # Step 1: Parse intent
    intent = parse_intent(input_text)
    # If the LLM failed and returned an error, we still proceed with the intent (which will be unknown)
    # The grounding step will handle unavailable data.

    # Step 2: Ground the data
    grounded = get_grounded_data(intent)

    # Step 3: Generate slide spec
    spec = generate_slide_spec(grounded)

    # Step 4: Render the slide
    try:
        output_path = render_slide(spec, grounded)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate slide: {str(e)}")

    # Return the spec, relative file path, and grounding status
    filename = os.path.basename(output_path)
    return JSONResponse(content={
        "spec": spec,
        "file_path": output_path,
        "filename": filename,
        "grounded": grounded.get("status") == "available"
    })

@app.get("/download/{filename}")
async def download_slide(filename: str):
    """Download a generated slide file."""
    file_path = os.path.join(OUTPUT_DIR, filename)
    # Security: ensure the path doesn't escape the OUTPUT_DIR
    real_path = os.path.realpath(file_path)
    output_dir_real = os.path.realpath(OUTPUT_DIR)
    if not real_path.startswith(output_dir_real):
        raise HTTPException(status_code=400, detail="Invalid file path")
    if not os.path.exists(real_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(real_path, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename=filename)

# Mount static files for the frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

# To run the app directly for testing:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)