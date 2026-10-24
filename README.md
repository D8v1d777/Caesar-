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

This repository is a **product and engineering foundation**. The current baseline contains the MIT license and project documentation; the application scaffold and runtime features have not yet been implemented. See the roadmap and implementation plan before claiming any capability is working.

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

## Development status

See [ROADMAP.md](docs/roadmap/ROADMAP.md). No UI, backend, plugin marketplace, Android client, or AI feature should be represented as implemented until code and tests demonstrate it.
