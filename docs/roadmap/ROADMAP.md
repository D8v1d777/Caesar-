# Caesar Roadmap

This is a proposed sequence, not a claim of completed work. Work should advance only when the previous gate has evidence.

## Phase 0 — Product and engineering foundation
- [x] Repository identified and baseline inspected.
- [ ] Product requirements, architecture, UI, security, plugin, tutorial, and contribution docs reviewed by the team.
- [ ] Windows hardware and supported OS targets agreed.
- [ ] Threat model and data-flow diagram reviewed.
- [ ] Technology spike decision recorded.

**Exit gate:** Team agrees on interfaces, trust boundaries, MVP scope, and verification plan.

## Phase 1 — Windows shell and design system
- Desktop shell, navigation, theme tokens, typography, components, accessibility primitives.
- Home, create workspace, presentation canvas, proposal preview, settings, tutorial shell.
- Synthetic data and deterministic sample requests only.
- Keyboard and visual QA.

**Exit gate:** Polished, navigable prototype with all required UI states and no company data dependency.

## Phase 2 — Hybrid voice and approval loop
- [x] Define and test the frontend voice-session transition contract (state logic only; no capture/runtime yet).
- Local speech-to-text spike and microphone permissions.
- Session state machine and persistent listening indicator.
- Typed action proposals, preview, approval, rejection, cancellation, undo.
- No automatic display changes from contextual listening.

**Exit gate:** Tests prove no unapproved visible changes and predictable behavior under interruption.

## Phase 3 — Company service and governed data
- Authenticated FastAPI service and synthetic PostgreSQL.
- Read-only adapter, metric catalog, allowlists, query limits, policy checks.
- Provenance, freshness, validation, audit events.
- Tenant isolation and prompt-injection tests.

**Exit gate:** Data accuracy and authorization tests pass; real connectors remain disabled until security review.

## Phase 4 — Visual quality and presentation export
- Chart components, reusable templates, slide outline, summaries, speaker notes.
- PowerPoint export and provenance behavior.
- Responsive states, loading/error/offline handling, keyboard and screen-reader QA.

**Exit gate:** Controlled test set is numerically correct and presentation export is reviewed.

## Phase 5 — Integrations tab and curated connector lifecycle
- Catalog, details, permissions, install/configure/test/disable/uninstall.
- Start with built-in declarative adapters; no arbitrary plugin code.
- Signed manifest verification and update/revocation semantics before external extensions.

**Exit gate:** Permission and package-validation tests pass.

## Phase 6 — Pilot readiness
- Windows packaging and signed release pipeline.
- Network egress validation, dependency review, recovery testing, performance benchmarks.
- Pilot with synthetic data first, then a specifically approved customer environment.
- Operational runbook and incident response.

**Exit gate:** Security, product, and usability sign-off with recorded evidence.

## Phase 7 — Android follow-on
- Reuse platform-neutral API contracts, design tokens, tutorial content, and policy semantics.
- Implement Android-specific permissions, lifecycle, mobile navigation, local inference benchmarks, and safe session interruption.
- Do not promise background listening or feature parity until validated.

**Exit gate:** Android acceptance tests, permission review, accessibility checks, and offline/failure tests pass.

## Deferred until evidence supports them
- Public third-party plugin marketplace.
- Unrestricted agents or arbitrary tool execution.
- Broad Gmail/drive ingestion.
- Universal integrations.
- Company-wide collaboration features.
- Local caching of sensitive company data.
- Custom foundation-model training.
