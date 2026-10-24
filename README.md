# Caesar

**Speak. Shape. Present.**

Caesar is a privacy-first, voice-driven presentation copilot. It helps people turn natural-language requests and approved business data into polished slides, charts, and dashboards—without requiring presentation expertise or prompt-engineering skills.

## Product principles

- **Windows first, Android second.** The first production client targets Windows desktop. Android is a planned follow-on client, not a launch blocker.
- **Hybrid interaction.** Caesar listens only when enabled, understands context, and proposes useful actions. It does not change the visible presentation until the presenter approves.
- **Privacy by architecture.** Company processing runs in company-controlled infrastructure. Local processing is preferred for audio and fallback tasks where practical.
- **Evidence before visuals.** Business figures must have a source, reporting period, freshness status, and validated calculation.
- **Fail closed.** Authorization, provenance, or validation failures must never be converted into confident-looking output.
- **Designed, not decorated.** The UI should feel calm, precise, premium, and highly usable—not like a generic AI dashboard.

## Status

This repository contains an **early interactive prototype and API contract spike**, not a production application. The Windows prototype is a React/TypeScript web app; the FastAPI service serves fixed synthetic metrics. CI builds the frontend and runs the API tests. The prototype's microphone, proposal approval, and integration controls are simulated local UI state. The frontend is not connected to the API, and there is no Tauri desktop shell, speech recognition, model orchestration, authentication, live database, or real connector. See the implementation status below and the roadmap before claiming any capability is production-ready.

## Start here

1. Product requirements: [docs/product/PRD.md](docs/product/PRD.md)
2. Architecture: [docs/architecture/overview.md](docs/architecture/overview.md)
3. Privacy and security: [docs/security/privacy-and-security.md](docs/security/privacy-and-security.md)
4. UI/UX specification: [docs/product/ui-ux-spec.md](docs/product/ui-ux-spec.md)
5. Integrations and plugin system: [docs/product/integrations-and-plugins.md](docs/product/integrations-and-plugins.md)
6. Built-in tutorial and onboarding: [docs/product/onboarding-and-tutorial.md](docs/product/onboarding-and-tutorial.md)
7. Roadmap: [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md)
8. Design decision record: [docs/superpowers/specs/2026-10-23-caesar-foundation-design.md](docs/superpowers/specs/2026-10-23-caesar-foundation-design.md)
9. Developer implementation plan: [docs/superpowers/plans/2026-10-23-caesar-foundation.md](docs/superpowers/plans/2026-10-23-caesar-foundation.md)

## Proposed first-release architecture

- Windows desktop client: Tauri 2 + React + TypeScript, subject to a short architecture spike.
- Company-controlled processing API: Python + FastAPI.
- Local speech recognition: whisper.cpp candidate; benchmark on target Windows hardware before committing.
- Data access: one read-only PostgreSQL connector over synthetic/demo data first.
- Visualization: React with a charting library selected during the UI spike.
- Presentation export: editable PowerPoint export in a later MVP milestone.
- Android: a separate native-quality client after the Windows interaction, contracts, and trust model stabilize.

These are proposed technology choices, not evidence of a working implementation.

## Team rules

- Read the product, architecture, and security docs before implementing a feature.
- Never connect real company data during early prototypes; use synthetic data.
- Do not send audio, transcripts, company data, or credentials to unapproved destinations.
- Do not grant a language model direct database credentials or unrestricted tool execution.
- Keep approval, authorization, data retrieval, validation, and display as separate responsibilities.
- Add tests with every behavior change and document any deviation from the spec.
- Never mark a feature complete without recorded verification evidence.

## Current implementation status

| Area | Current state | Important boundary |
|---|---|---|
| Windows UI | Interactive React/TypeScript prototype | Runs in a browser; no Tauri shell yet |
| Proposal/approval flow | Simulated local UI state | Not authorization, durable approval, or an audit record |
| Microphone / speech | UI indicator only | No audio capture or speech recognition |
| API | FastAPI synthetic-data contract | No authentication, tenant isolation, or live data |
| Data provenance | Synthetic API response fields | UI does not yet consume or display API responses |
| Integrations | Local demo toggles | No connector is installed and no external service is contacted |
| AI/model orchestration | Not implemented | Prompts do not invoke a model |
| Export / Android | Not implemented | Planned follow-on work |

CI passing means the current frontend build and API test suite pass; it does **not** mean the product workflows above are implemented end to end.

See [ROADMAP.md](docs/roadmap/ROADMAP.md) for the sequence and acceptance gates. Do not connect real company data or expose the API beyond loopback until the required identity, authorization, tenant isolation, and security controls have been implemented and reviewed.
