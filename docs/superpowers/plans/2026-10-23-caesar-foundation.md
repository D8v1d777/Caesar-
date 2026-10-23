# Caesar Foundation Implementation Plan

> For agentic workers: use superpowers:subagent-driven-development where available, or superpowers:executing-plans to implement this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Establish a reviewable product foundation and then implement a privacy-first Windows desktop prototype whose visible presentation changes only after explicit approval.

**Architecture:** Windows desktop client connected to a company-controlled API. Begin with synthetic data, typed proposals, a deterministic approval state machine, and constrained visualization rendering. Keep Android on the roadmap until Windows behavior and contracts stabilize.

**Tech Stack:** Proposed Tauri 2, React/TypeScript, whisper.cpp candidate, Python/FastAPI, Pydantic, PostgreSQL synthetic fixtures, React chart library, PowerPoint export later. Validate these choices in Task 1 before locking dependencies.

**Spec:** docs/superpowers/specs/2026-10-23-caesar-foundation-design.md

## Global Constraints

- Windows desktop first; Android second.
- Company-controlled processing; local fallback only for supported capabilities.
- Context listening never changes the visible presentation by itself.
- Approval must bind to the exact proposal and content version.
- Data authorization is independent of model output and UI state.
- Use synthetic data until a separate production data review approves a connector.
- No unrestricted model-generated SQL, shell commands, arbitrary code, or network actions.
- Every business metric includes source, period, definition, and freshness.
- No unapproved outbound data flow; no raw audio/transcript retention by default.
- UI must support keyboard access, visible focus, screen readers, scalable text, and reduced motion.

## Review Focus

1. A user speaks an ambiguous or interrupted request; Caesar must not act or display a guess.
2. An approval is replayed after proposal content changes; it must be rejected.
3. Data is stale or lacks provenance; it must not be presented as current.
4. A malicious instruction appears in a retrieved review; it must not expand permissions.
5. The company service goes offline; fallback must not bypass authorization or fabricate freshness.

---

## Task 1: Validate architecture assumptions

**Files:**
- Create: docs/architecture/technology-decisions.md
- Create: docs/architecture/adr/0001-windows-client-and-company-api.md
- Create: docs/architecture/adr/0002-approval-and-data-boundaries.md

- [ ] Benchmark local speech-to-text on agreed Windows hardware using synthetic test utterances.
- [ ] Verify desktop shell permission model, update model, and safe IPC boundaries.
- [ ] Prototype a typed request-to-visual-spec round trip without external network access.
- [ ] Record actual measurements, dependency versions, trade-offs, and decisions.
- [ ] Review ADRs with product and security owners before adding production dependencies.

**Acceptance:** The team can explain the chosen runtime and data flow with evidence; no external model or real company data is connected.

## Task 2: Build desktop shell and design foundations

**Files:**
- Create: apps/windows/ package and source structure (exact scaffold after Task 1)
- Create: packages/design-tokens/
- Create: packages/ui/
- Test: apps/windows UI/component tests

- [ ] Build the application shell, navigation, theme tokens, typography, buttons, fields, dialogs, toasts, status indicators, and accessible focus primitives.
- [ ] Add Home, Create, Presentation, Integrations, Templates, Tutorials, and Settings routes with honest placeholder states.
- [ ] Add loading, empty, error, offline, permission-denied, and stale-data states.
- [ ] Add keyboard-only interaction tests and visual snapshots where stable.
- [ ] Run component tests and inspect supported Windows scaling/window sizes.

**Acceptance:** A navigable polished prototype exists; every placeholder is visibly marked as unavailable rather than pretending to work.

## Task 3: Implement hybrid session and approval state machine

**Files:**
- Create: packages/contracts/action-proposal schema
- Create: apps/windows session state machine
- Create: apps/windows proposal/approval UI
- Test: session state machine and UI tests

- [ ] Write tests for idle → listening → proposal → approval → execution → render-ready → displayed.
- [ ] Test rejection, cancellation, expiration, interruption, and service loss.
- [ ] Bind approval to proposal ID, payload hash, user, and expiry.
- [ ] Invalidate approval on any material change.
- [ ] Ensure contextual listening cannot update the visible presentation.
- [ ] Run tests and verify every invalid transition is rejected.

**Acceptance:** No path changes the presentation without a valid approval and validated result.

## Task 4: Build synthetic company API and policy boundary

**Files:**
- Create: services/api/ FastAPI service
- Create: services/api policy and metric modules
- Create: services/api synthetic fixtures and database migrations
- Test: API authorization and metric tests

- [ ] Define typed request, proposal, approval, metric result, and visual-spec contracts.
- [ ] Add a synthetic PostgreSQL dataset with known expected values.
- [ ] Use a read-only database role, parameterized queries, metric/dimension allowlists, query limits, and timeouts.
- [ ] Reject unknown fields, invalid periods, unauthorized metrics, and cross-tenant requests.
- [ ] Add source, definition, period, freshness, and actual/forecast/estimate metadata.
- [ ] Run unit and API integration tests against the synthetic dataset.

**Acceptance:** Valid requests produce expected typed results; invalid or unauthorized requests fail closed.

## Task 5: Add intent adapter and constrained visualization

**Files:**
- Create: services/api intent adapter
- Create: packages/contracts/visual-spec schema
- Create: apps/windows chart renderer
- Test: schema validation, prompt-injection, and numerical correctness tests

- [ ] Start with deterministic intent fixtures; introduce a model adapter only behind a stable interface.
- [ ] Accept only allowlisted action types and parameters.
- [ ] Treat retrieved text as untrusted data.
- [ ] Reject arbitrary HTML, scripts, SQL, tool names, and unknown visual components.
- [ ] Render from validated numeric results, not model-invented values.
- [ ] Test malformed model output, missing provenance, and incompatible periods.

**Acceptance:** All rendered numeric values trace to validated fixture results; malicious source text cannot trigger privileged actions.

## Task 6: Local speech and truthful fallback

**Files:**
- Create: apps/windows audio/session module
- Create: apps/windows fallback capability registry
- Test: audio lifecycle, mute, offline, and stale-data tests

- [ ] Benchmark local speech recognition and select a model/runtime compatible with licensing and target hardware.
- [ ] Add explicit microphone start/stop, persistent indicator, immediate mute, and permission-denied UX.
- [ ] Clear transient session content at end according to policy.
- [ ] Allow local rendering of available approved data only.
- [ ] Clearly label service availability and data freshness.
- [ ] Verify network egress under the no-external-processing profile.

**Acceptance:** Supported local features work without the company service; unsupported data access is blocked honestly.

## Task 7: Onboarding, templates, and export

**Files:**
- Create: apps/windows tutorial flow
- Create: packages/templates/ synthetic examples
- Create: presentation export module
- Test: tutorial progression, export content, and accessibility tests

- [ ] Implement the tutorial specified in docs/product/onboarding-and-tutorial.md.
- [ ] Add a small curated set of original, reusable presentation themes.
- [ ] Add summary, outline, and speaker-note features using only approved inputs.
- [ ] Implement editable PowerPoint export after export fidelity is tested.
- [ ] Test source/provenance retention, keyboard access, reduced motion, and cancellation.

**Acceptance:** New users can complete the guided synthetic-data workflow and export a usable artifact.

## Task 8: Integration catalog and lifecycle

**Files:**
- Create: packages/contracts/plugin-manifest schema
- Create: apps/windows integrations catalog and detail screens
- Create: services/api connector registry interface
- Test: manifest validation, permission grants, install failure, revocation, and uninstall tests

- [ ] Start with built-in declarative connectors; do not execute arbitrary third-party plugin code.
- [ ] Display publisher, status, platform, data handling, and requested permissions.
- [ ] Require explicit install and permission grant.
- [ ] Reject invalid signatures, forbidden scopes, unsupported versions, and unknown endpoints.
- [ ] Add configure, test, disable, revoke, and uninstall flows.
- [ ] Verify revocation is enforced server-side and secrets never enter logs.

**Acceptance:** Connector lifecycle is understandable and cannot bypass authorization or approval.

## Task 9: Security hardening and release evidence

**Files:**
- Create: docs/security/threat-model.md
- Create: docs/operations/runbook.md
- Create: CI workflows and test configuration
- Test: security regression suite and release build

- [ ] Test token expiry/revocation, tenant isolation, prompt injection, proposal replay, stale data, and forbidden egress.
- [ ] Add dependency scanning, secret scanning, lint, type checks, unit tests, and packaging checks as applicable.
- [ ] Review crash reporting, update checks, logs, and all network destinations.
- [ ] Document incident response, rollback, and data deletion.
- [ ] Run the full suite and attach evidence to the release candidate.

**Acceptance:** Security and product owners sign off on observed behavior; no test is reported as passed without actual output.

## Task 10: Android follow-on planning

**Files:**
- Create: docs/platform/android-plan.md

- [ ] Reuse stable contracts and tokens; do not fork product semantics.
- [ ] Define Android microphone lifecycle, foreground indicators, permission UX, offline capability, and minimum OS/hardware.
- [ ] Build only after Windows MVP exit gates pass.

**Acceptance:** Android scope and platform-specific risks are documented; Windows delivery is not delayed by premature parity work.
