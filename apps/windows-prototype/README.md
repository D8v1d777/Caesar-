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

## Deliberate limitations

- All displayed numbers and charts are illustrative synthetic data.
- Voice input is not wired up. The microphone control explicitly reports that the local speech runtime is unavailable; it does not request microphone permission, capture audio, or use a cloud transcription fallback.
- A typed and tested voice-session state machine defines the future runtime lifecycle (permission, capture, transcription, cancellation, transcript handoff, and errors).
- The Integrations screen can call the local synthetic API through the Vite `/api` proxy and display the returned metric provenance. This is a contract demo only; no company data, model provider, live database, real connector, plugin runtime, PowerPoint export, or authentication service is connected.
- Proposal state exists only in browser memory. It is not an authorization boundary or durable audit record.
- This initial scaffold does not include the Tauri/Rust shell yet. Add it after the team validates Windows build prerequisites and the narrow capability/IPC policy.

## Build verification

Run `npm install` and `npm run build` on the developer machine. This hosted editing session has not executed the npm toolchain, so no successful build is claimed.
