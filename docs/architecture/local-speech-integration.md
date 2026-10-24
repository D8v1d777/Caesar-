# Local Speech Integration Contract

**Status:** The loopback browser prototype now has an optional capture and local whisper.cpp process adapter. The runtime is not bundled or configured by default, and Windows end-to-end behavior has not been manually verified.

## Decision

Use **whisper.cpp as the first local speech-to-text candidate** for a Windows runtime spike. Keep the decision conditional on measured latency, transcription quality, memory use, package size, and licensing review on supported Windows hardware. The upstream project documents Windows support for MSVC and MinGW and local inference: [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp).

The current React/Vite app is a browser prototype. It must not pretend that a button click means recording is active. Until a trusted desktop bridge and a configured local speech engine exist, the voice control must report unavailable without requesting microphone permission.

## Runtime boundary

The planned integration is a Tauri desktop capability that invokes one pinned local transcription executable. Tauri's shell plugin documentation states that potentially dangerous commands are blocked by default and require explicit capability permissions: [Tauri v2 Shell Plugin](https://v2.tauri.app/plugin/shell/).

Required constraints:

- Do not enable a general shell, command interpreter, arbitrary executable path, or arbitrary argument execution.
- Resolve the executable and model from application-managed, validated locations; do not accept their paths from a user prompt, transcript, or model output.
- Invoke a fixed executable with an argument array, never through `cmd.exe`, PowerShell, `sh -c`, or shell-string interpolation.
- Pin the model/runtime versions and verify package integrity (including a recorded SHA-256) before enabling the engine.
- Do not download models or runtime binaries during a listening session. Model acquisition must be a separate, explicit setup step with source, size, license, and integrity shown.
- Keep speech processing local. No cloud transcription fallback, telemetry upload, or external model request is allowed by this contract.
- Audio buffers and temporary files must be bounded, cleaned on success/failure/cancel, and not retained by default.
- Do not keep a raw transcript in persistent storage by default. An active transcript is temporary session state.
- Spoken words are input, never approval. A transcript may populate the request composer or draft a proposal; a separate explicit user action is required to create and approve proposal content.
- A new proposal must still pass existing content-bound approval checks; transcript completion cannot directly update the presentation canvas.

## Session state contract

Implemented in `apps/windows-prototype/src/voiceSession.ts`, the pure reducer defines the expected lifecycle. The optional prototype bridge is in `apps/windows-prototype/src/localVoice.ts` and `services/api/app/speech.py`; the API is restricted to loopback clients and an exact development Origin:

`unavailable → idle → requesting_permission → listening → transcribing → transcript_ready`

Permission denial, transcription failure, cancellation, empty speech, out-of-order events, and runtime loss have explicit behavior. The reducer performs no capture, network, process, file, or presentation operations. Its initial state is unavailable until a trusted runtime reports readiness.

## Required runtime behavior

1. User explicitly requests voice input; never start listening on launch or because ambient context suggests it.
2. Explain the local processing boundary and request microphone permission through the trusted desktop runtime.
3. Render a persistent listening indicator and a direct stop/cancel control while capture is active.
4. Stop capture when the user stops, the window/session is closed, or an unrecoverable error occurs.
5. Transcribe only with the configured local model. If the binary/model is missing, invalid, slow, or fails, explain the error and do not silently switch providers.
6. Present recognized text visibly for correction before it creates a proposal.
7. Require a separate approval to make any change visible on the presentation canvas.
8. Clear transient audio and transcript state on cancel, session end, or error cleanup according to the tested policy.

## Acceptance gates

- Unit tests reject illegal state transitions and prove the unavailable state cannot be entered by clicking Start.
- Integration tests cover permission granted/denied, stop/cancel, empty transcript, runtime/model missing, process error, timeout, window close, and process termination.
- A network egress test demonstrates that audio and transcript do not reach non-loopback or external endpoints during local transcription.
- A retention test verifies transient audio, temporary files, and transcript state are cleared on all exit paths.
- Windows hardware benchmarks report model size, cold-start time, first-transcript latency, sustained latency, CPU/RAM use, and quality on a fixed evaluation set.
- A security review validates Tauri capabilities, executable and model integrity, microphone permissions, and update/revocation behavior before pilot use.

## Not yet implemented

The packaged Tauri desktop shell, bundled runtime/model installer, release integrity manifest, process supervision/cancellation for in-flight transcription, streaming transcription, and Windows hardware benchmarks remain unimplemented. The current local prototype uses browser capture and a temporary WAV file for a bounded one-shot command. It must not be treated as production-ready until loopback-only egress, file cleanup on every failure path, cancellation/timeout behavior, source authenticity, and Windows acceptance tests are independently verified.
