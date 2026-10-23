# Caesar Architecture Overview

**Architecture status:** Proposed; not yet implemented  
**Deployment:** Windows client + company-controlled processing service  
**Secondary platform:** Android client after Windows MVP

## 1. Architectural principles

1. The language model proposes; deterministic services authorize.
2. Approval, authorization, retrieval, validation, and display are distinct steps.
3. The desktop client never receives privileged database credentials.
4. Company data stays in approved infrastructure unless a documented policy explicitly permits another path.
5. Every connector has an explicit capability and permission contract.
6. Failure is visible and conservative; no silent substitution of stale data.
7. Keep the first deployment modular, not microservice-heavy.

## 2. Logical components

### Windows desktop client
Responsibilities: application shell, microphone controls, local speech recognition, session state, proposal preview, approval controls, canvas, local export, settings, onboarding, and integration management UI.

### Local capability layer
Responsibilities: supported local speech/command processing, rendering from already available data, static templates, and offline status. It must not bypass server authorization. Secure caching is out of scope until its threat model and revocation behavior are approved.

### Company API
Responsibilities: authenticated API boundary, request schema validation, policy enforcement, session and tenant checks, orchestration, rate limits, and audit events.

### Intent adapter
Converts natural language into a typed, allowlisted action proposal. It has no database credentials and no direct arbitrary tool execution.

### Policy engine
Evaluates user identity, tenant, requested action, metric/dimension permissions, data classification, session state, and approval binding. The policy engine is deterministic and independent of model output.

### Data adapter
Executes parameterized, allowlisted read-only queries or calls a governed analytics API. It enforces query limits and returns typed data plus provenance.

### Validation and metric layer
Uses approved metric definitions, period rules, aggregation logic, and validation checks. It distinguishes actuals, forecasts, and estimates. Explanations must not state causation from correlation alone.

### Visual specification renderer
Converts validated result objects into constrained chart/slide specifications. The client renders only supported component types and sanitized content.

### Integration manager
Stores connector metadata, configuration references, permission grants, health state, and lifecycle events. Secrets remain in OS secure storage or company-side secret management, not in extension manifests or logs.

## 3. Request lifecycle

1. User explicitly starts a listening session.
2. Audio is processed locally where supported; session context is temporary by default.
3. A request or contextual suggestion is detected.
4. The client shows a proposal; contextual listening alone cannot display a new visual.
5. User approves the specific proposed action.
6. The API authenticates the request and independently evaluates authorization.
7. Data access uses an allowlisted query or approved API.
8. Results are validated and tagged with source, metric definition, period, and freshness.
9. The server returns a typed visual specification and provenance.
10. The client checks the proposal/version and approval binding, then displays the validated result.
11. Relevant security events are audited with minimal content.
12. Session end clears transient context according to policy.

If any authorization or validation step fails, the new visual is not displayed.

## 4. Proposed initial contracts

### ActionProposal
- proposal_id: opaque unique identifier
- session_id: opaque session identifier
- action_type: allowlisted enum
- parameters: action-specific typed schema
- requested_data_scope: explicit metric/dimension/period set
- created_at and expires_at
- preview_summary
- requires_approval: true for presentation-changing actions
- policy_version and schema_version

### Approval
- proposal_id
- user_id / authenticated principal
- approved_payload_hash
- approved_at
- expires_at

Approval must be bound to the exact proposal content. Any material change to action, data scope, or rendered content invalidates the approval.

### MetricResult
- metric_id and human-readable definition
- numeric values and dimensions
- reporting period and timezone where relevant
- source system / dataset identifier
- calculated_at and source freshness timestamp
- actual/forecast/estimate classification
- validation status and limitations

### VisualSpec
- schema_version
- approved proposal identifier
- component type from a fixed allowlist
- title/subtitle and safe labels
- data references to validated result fields
- accessible description and table alternative
- provenance block
- theme tokens; no arbitrary executable code or remote HTML

## 5. Trust boundaries

- Microphone/OS → client: explicit capture, visible status, no recording by default.
- Client → API: authenticated encrypted transport; server-side identity and policy checks.
- API → data source: read-only least privilege, parameterized queries, limits, tenant restrictions.
- Retrieved content → model: untrusted data; never treat content as privileged instructions.
- Model output → renderer: schema validation, sanitization, component allowlist.
- Proposal → display: approval bound to proposal hash and valid session.
- Plugin → host: capability-based permissions, signed package verification, sandboxing and resource limits.

## 6. Deployment topology

Development: Docker Compose for API and synthetic PostgreSQL data, plus local Windows desktop app. No production credentials.

Production: company-approved private cloud or on-premises service, TLS, managed identity/secret storage, database network restrictions, logs and monitoring configured under customer policy. External model endpoints are disabled unless explicitly approved by the organization.

## 7. Windows then Android

Windows is the first implementation target. The API contracts, action proposal schema, policy semantics, integration manifest, visual specification, and design tokens should be platform-neutral. Android reuses these contracts but receives a native-quality interaction model and Android-specific permission handling; it is not simply a scaled-down Windows layout.

## 8. Observability

Record minimal events such as session_started, proposal_created, approval_granted, approval_rejected, policy_denied, data_validation_failed, connector_health_changed, export_completed, and session_ended. Avoid raw audio, full transcripts, dataset rows, secrets, and presentation bodies in routine logs. Define retention and access controls before enabling production audit storage.

## 9. Architecture decision gates

Before implementation locks in technology, benchmark Windows local speech recognition; validate Tauri's platform/security model; test a typed request/visual-spec round trip; verify company identity integration; and evaluate chart/export accessibility and fidelity.
