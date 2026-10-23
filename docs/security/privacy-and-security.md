# Caesar Privacy and Security Requirements

**Status:** Mandatory design constraints; implementation and compliance are not yet verified.

## 1. Privacy promise

Caesar is designed to process company information within organization-approved infrastructure. This promise is only valid for a deployment whose audio, model, telemetry, crash reporting, updates, connector, and logging paths have been reviewed. “Local-first” is not equivalent to “offline” or “no data leaves the device.”

## 2. Data classes

- Public: product help and public documentation.
- User workspace: local drafts and user settings.
- Confidential business data: sales, finance, customer feedback, internal reports.
- Restricted data: payroll, credentials, regulated or specially classified records.
- Session audio/transcript: potentially sensitive meeting content.

Each connector and feature must declare which classes it can access and where processing occurs.

## 3. Defaults

- Microphone disabled until the user starts a session.
- Persistent recording disabled by default.
- Transient audio/transcripts held in memory where practical and cleared at session end.
- Product analytics disabled for content-bearing data; only approved minimal operational events may be collected.
- External model providers and third-party processing disabled unless explicitly approved by an administrator.
- No real company data in development fixtures, screenshots, tests, or issue reports.
- No company dataset cache in the first MVP.
- No plugin installation without explicit user action and permission review.

## 4. Identity and authorization

- Use the company's identity provider through OIDC where supported.
- Validate token issuer, audience, expiry, and session status server-side.
- Apply least privilege and tenant isolation at every data access.
- Use read-only database credentials for analytics.
- Do not expose service credentials to the desktop client, model, logs, or plugin.
- Approval is scoped to one action and one exact proposal version; it is not a broad grant of future access.
- Expired/revoked sessions cannot use offline mode to bypass access control.

## 5. AI threat model

### Prompt injection
Treat documents, customer reviews, spreadsheet cells, web pages, and connector output as untrusted data. They cannot issue instructions to the policy engine or expand permissions.

### Excessive agency
The model may only produce allowlisted typed proposals. It cannot execute arbitrary SQL, shell commands, code, arbitrary HTTP requests, or install plugins.

### Sensitive data disclosure
Minimize data sent to a model. If a model is outside the company boundary, require documented approval, an explicit data-flow review, and provider terms acceptable to the organization.

### Hallucinated metrics
Only validated query results can supply numeric values. Reject missing/invalid provenance, incompatible periods, unsupported metric definitions, and calculations that fail validation. Label forecasts and estimates distinctly.

### UI deception
The model cannot create arbitrary HTML or executable content for the trusted client. Render a constrained visual schema with sanitized text and known components.

### Approval replay / TOCTOU
Bind approval to proposal ID, payload hash, user, and expiry. Revalidate authorization and freshness at execution. Any material change requires a new approval.

## 6. Network and supply chain

- Maintain an allowlist of network destinations for each deployment.
- Verify actual outbound traffic; do not infer privacy from configuration alone.
- Pin and review dependencies; scan packages and release artifacts.
- Verify plugin signatures, publisher identity, version, permissions, and integrity before installation.
- Plugin updates must be authenticated and rollback-safe.
- No automatic arbitrary extension code execution in the trusted process.
- Secrets use OS secure storage on desktop or managed secret storage server-side.
- Keep release signing keys outside the repository and CI logs.

## 7. Local fallback

Fallback is allowed only for capabilities supported locally. It may render existing approved data or work with explicitly permitted local data, but it must not claim current company data without verifying freshness. A cached token is not an authorization bypass. Secure cache support requires separate design approval, encryption, tenant/user scoping, expiry, revocation handling, and deletion semantics.

## 8. Audit and retention

Audit security decisions and connector lifecycle events with minimal payloads. Do not routinely log raw audio, full transcripts, secret values, raw customer rows, or full slide contents. Set access restrictions and retention before production deployment. Audit logs must not become a secondary data-exfiltration channel.

## 9. Required tests

- Unauthorized user and tenant access.
- Expired/revoked token.
- Disallowed metric/dimension and oversized query.
- Prompt injection embedded in retrieved data.
- Invalid/missing provenance and stale data.
- Proposal mutation after approval.
- Cancelled/expired proposal replay.
- External egress attempt under a no-egress policy.
- Plugin with excess permission or invalid signature.
- Service outage and local fallback behavior.
- Secret leakage into logs and error messages.

## 10. Release gate

No production company connector or external model integration may ship until the team documents its data flow, threat model, permissions, retention, network destinations, tests, and rollback plan. This document is not a certification or a claim that Caesar is currently secure.
