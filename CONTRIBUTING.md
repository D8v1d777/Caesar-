# Contributing to Caesar

## Workflow

1. Read AGENTS.md and the relevant product/security specifications.
2. Create a focused branch from the current main branch.
3. State the intended behavior and acceptance criteria before implementation.
4. Add a failing test for the behavior where practical, then implement the smallest change that passes.
5. Run focused tests and all relevant checks available in the repository.
6. Update docs when contracts, permissions, UX, or platform behavior change.
7. Open a pull request using the template and include verification evidence.

## Pull request standards

- One coherent change per pull request.
- No real customer/company data, credentials, tokens, recordings, or private datasets in commits or fixtures.
- Include screenshots or a short screen recording for material UI changes when possible.
- Describe keyboard access, screen-reader behavior, loading states, empty states, and error states for new UI.
- Identify network destinations and data categories for changes involving AI, telemetry, connectors, or plugins.
- Security-sensitive changes require explicit threat analysis and tests.
- Never merge a feature that bypasses the approval gate or data authorization policy.

## Design quality bar

The target is a premium, original, calm, highly legible interface. Review hierarchy, spacing, typography, contrast, density, transitions, keyboard flow, and error states—not only the happy path. Avoid generic gradient-heavy AI styling and avoid imitating proprietary assets.

## Licensing

Retain the repository license and include required notices for any added third-party dependency or asset. Confirm redistribution rights before bundling models, fonts, icons, or templates.
