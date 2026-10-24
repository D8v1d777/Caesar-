# Caesar Foundation Design

**Date:** 2026-10-23  
**Status:** Proposed baseline for developer-team review  
**Scope:** Product and engineering foundation for a Windows-first, privacy-first presentation copilot

## Intent

Caesar helps people create polished, data-backed presentations by speaking naturally. It listens only during an explicitly enabled session, understands context, and suggests actions without changing the visible presentation until the presenter approves. Company processing runs in company-controlled infrastructure; local fallback is limited to verified local capabilities. Android follows Windows once the core workflow and contracts are stable.

## Why

Generic presentation AI can require prompting expertise, may produce unsupported numbers, and may send data to external services. Caesar's product value is a unified workflow that combines voice, governed company data, presentation-quality visuals, an approval gate, onboarding, and a controlled integration catalog.

## Goals
- Windows-first desktop MVP; Android later.
- Hybrid context and explicit approval for visible changes.
- Company-controlled processing and documented data boundaries.
- Accurate, traceable data-backed visuals.
- Premium original UI with accessibility and complete states.
- Built-in interactive tutorial.
- Curated integration catalog with explicit permission review and lifecycle controls.
- Developer-ready contracts, milestones, tests, and contribution rules.

## Non-goals
- Implementing all integrations in the first release.
- Training a new foundation model.
- Unrestricted model-generated SQL, code, shell, or network actions.
- Public arbitrary-code plugin marketplace in the MVP.
- Claiming full offline equivalence.
- Shipping Android before Windows is proven.

## Approaches considered

1. Cloud-first web application: fastest broad deployment, but less aligned with the user's Windows desktop workflow and local speech/fallback requirements.
2. Windows desktop client plus company-controlled API, with local fallback: recommended because it balances native desktop experience, enterprise control, reusable contracts, and conservative fallback.
3. Fully local desktop application: strongest local boundary for supported tasks but makes centrally governed data, model quality, updates, and shared enterprise administration harder.

## Chosen approach

Use a Windows desktop client with a company-controlled processing API. Proposed initial stack: Tauri 2, React/TypeScript, local speech recognition benchmark (whisper.cpp candidate), FastAPI, Pydantic, synthetic PostgreSQL, constrained chart specifications, and editable PowerPoint export in a later milestone. These choices require a small validation spike before being locked in.

## Product behavior
- Explicit start/stop for microphone capture.
- Listening context may produce suggestions, never automatic display changes.
- User approval is bound to one proposal and exact content version.
- Data access is separately authorized server-side.
- Every business metric exposes source, reporting period, definition, and freshness.
- Local fallback never claims current data without verified freshness.
- Integration install and permission grants require explicit user action.

## Security constraints
- No privileged credentials in the desktop client or model.
- Read-only allowlisted data access.
- Retrieved content is untrusted and cannot override system policy.
- Typed action proposals and constrained visual specs; no arbitrary code execution.
- No unapproved outbound data flow.
- Minimal audit events; no routine raw audio/transcript retention.
- Plugin manifests and packages are untrusted until verified.
- Fail closed on authorization, validation, and integrity failures.

## UI direction
Premium, calm, original, presentation-first design with excellent hierarchy, spacing, typography, chart clarity, keyboard navigation, screen-reader support, reduced motion, and complete empty/loading/error/offline states. Apple-level craft is a quality target, not permission to copy proprietary assets or exact layouts. Avoid generic gradient-heavy styling.

## Required documentation and ownership
- Product requirements and acceptance criteria: product team.
- Architecture and contracts: technical lead.
- Data flow, threat model, permissions, retention: security owner.
- Design system, interaction, accessibility, tutorial: design/frontend owner.
- Connector catalog, manifests, lifecycle: integration owner.
- Tests and release gates: implementation owners and reviewer.

## Open decisions for the team
Supported Windows versions and minimum hardware; company identity provider; hosting environment; speech/model benchmark; chart library; exact export requirements; audit retention; integration signature and update mechanism; Android minimum version. Record decisions in follow-up ADRs rather than silently changing the baseline.
