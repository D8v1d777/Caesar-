# Caesar Windows Prototype

An interactive front-end prototype for the Windows-first Caesar presentation copilot. This is a UI/interaction milestone, not a production application.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```powershell
cd apps/windows-prototype
npm install
npm run dev
```

Open the local URL printed by Vite (configured to bind to `127.0.0.1:5173`).

## Included interactions

- Workspace navigation: Overview, Create, Presentation, Integrations, Templates, Tutorial.
- Starter prompts create a proposal for review.
- Approval is a separate user action; only then does the demo presentation canvas change.
- Integrations can be enabled/disabled in local UI state, with explicit copy that no connection is made.
- A four-step onboarding tour and prototype disclosure modal.
- Responsive layouts, keyboard-visible focus, and reduced-motion support.

## Enable the local voice prototype (optional)

Start the API from a separate terminal, bound to loopback:

```powershell
cd services/api
python -m pip install -r requirements-dev.txt
$env:CAESAR_WHISPER_CPP_PATH = "C:\\path\\to\\whisper-cli.exe"
$env:CAESAR_WHISPER_CPP_SHA256 = (Get-FileHash $env:CAESAR_WHISPER_CPP_PATH -Algorithm SHA256).Hash
$env:CAESAR_WHISPER_MODEL_PATH = "C:\\path\\to\\verified-model.bin"
$env:CAESAR_WHISPER_MODEL_SHA256 = (Get-FileHash $env:CAESAR_WHISPER_MODEL_PATH -Algorithm SHA256).Hash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Only set the hashes after independently verifying the binary/model source and expected digest. Computing a file’s hash from itself detects later changes but does not establish that the original artifact is trustworthy. Follow the [official whisper.cpp Windows instructions](https://github.com/ggml-org/whisper.cpp) to build or obtain the local executable and model. Then start Vite in a second terminal with the commands above. The voice control remains unavailable if any file is absent or its hash does not match.

## Deliberate limitations

- All displayed numbers and charts are illustrative synthetic data.
- Voice input is optional and disabled by default. The microphone checks that a local whisper.cpp binary and model have valid configured paths and SHA-256 hashes before requesting microphone permission. Audio is captured in memory for up to 30 seconds, converted to 16 kHz mono PCM WAV, sent only to the loopback FastAPI endpoint, and processed by a fixed local command with no shell. There is no cloud transcription fallback; temporary audio files are cleaned after the local command returns.
- A typed and tested voice-session state machine guards the lifecycle (runtime readiness, permission, capture, transcription, cancellation, transcript handoff, and errors).
- Voice transcription is restricted to the local dev origin `http://127.0.0.1:5173`; the API accepts transcription uploads only from a loopback client and that exact origin.
- The Integrations screen can call the local synthetic API through the Vite `/api` proxy and display the returned metric provenance. This is a contract demo only; no company data, model provider, live database, real connector, plugin runtime, PowerPoint export, or authentication service is connected.
- Proposal state exists only in browser memory. It is not an authorization boundary or durable audit record.
- This initial scaffold does not include the Tauri/Rust shell yet. Add it after the team validates Windows build prerequisites and the narrow capability/IPC policy.

## Build verification

Run `npm install` and `npm run build` on the developer machine. This hosted editing session has not executed the npm toolchain, so no successful build is claimed.
