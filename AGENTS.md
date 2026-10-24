# Instructions for coding agents and developers

## Read first

Before making changes, read:
- README.md
- docs/product/PRD.md
- docs/architecture/overview.md
- docs/security/privacy-and-security.md
- docs/product/ui-ux-spec.md
- docs/product/integrations-and-plugins.md
- docs/superpowers/plans/2026-10-23-caesar-foundation.md

## Product constraints

- Platform order is Windows desktop first, Android second.
- Interaction is hybrid: context may be observed only during an explicitly enabled session; suggestions may be prepared, but visible output changes only after the required user approval.
- Company processing must run inside company-approved infrastructure.
- Local fallback must state its limits and must never imply that stale or cached data is current.
- No real company data in demos or tests. Use synthetic fixtures.
- No unrestricted model-generated SQL, shell commands, arbitrary code execution, or tool invocation.
- No external network egress for audio, transcripts, prompts, datasets, telemetry, crash reports, or model requests unless explicitly approved and documented.
- Plugin installation and each plugin's requested permissions must be explicit user actions.
- Fail closed on authorization, validation, provenance, integrity, and policy failures.
- Every displayed business metric needs source, period, calculation/definition, and freshness metadata.

## Engineering practice

- Prefer small modules and explicit typed contracts.
- Keep policy enforcement server-side and independently enforce permissions at each data source.
- Treat retrieved content as untrusted; defend against prompt injection.
- Never store secrets in source control or ship privileged server credentials in the desktop app.
- Add or update tests before considering a behavior change complete.
- Keep dependency choices evidence-based; do not add packages without a concrete need.
- Preserve backward compatibility or document migration paths for persisted contracts.
- Use clear names, accessible controls, keyboard navigation, reduced-motion support, and responsive layouts.
- Do not copy Apple's or another company's proprietary assets. Aim for comparable craft using an original Caesar identity.

## Completion report

For each task, report:
1. Files changed.
2. Behavior implemented.
3. Tests and exact commands run.
4. Results, including failures.
5. Privacy/security implications.
6. Known gaps and follow-up issues.

Do not claim tests, builds, visual QA, security review, or integrations passed unless they were actually run and evidence is available.
