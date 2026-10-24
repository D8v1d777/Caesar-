# Caesar Windows Prototype Handoff

**Status:** interactive front-end scaffold added on branch `feat/windows-prototype-approval-loop`.  
**Purpose:** unblock design and product review while keeping all company systems disconnected.

## What is available now

The `apps/windows-prototype` app has a dark, calm, high-contrast workspace; Overview, Create, Presentation, Integrations, Templates and Tutorial views; proposal review and explicit approval; synthetic illustrative charts; and a visible disclosure of unavailable features.

## How to run

From the repository root:

```powershell
cd apps/windows-prototype
npm install
npm run dev
```

Requires Node.js 20.19+ or 22.12+. The dev server is configured for localhost only.

## Review checklist for developers

- [ ] Run `npm install` and `npm run build`; fix TypeScript/compiler issues.
- [ ] Review responsive behavior and accessibility with keyboard-only navigation.
- [ ] Add component and state-machine tests before replacing demo state with API calls.
- [ ] Add Tauri 2 shell only after defining explicit capabilities and validating the Windows build environment.
- [ ] Implement proposal IDs, content hashes, authenticated user identity, expiry, and server-side authorization. Browser state alone must never authorize execution.
- [ ] Implement company API using synthetic fixtures and strict allowlists before any live data connector.
- [ ] Keep all provider egress disabled unless security owners explicitly approve an architecture and configuration.
- [ ] Add speech only after microphone start/stop, visible listening indicator, cancellation, and no-retention defaults are tested.
- [ ] Do not represent integration demo toggles as connected systems.

## Acceptance criteria for this milestone

- [x] A navigable UI prototype with core workspace areas.
- [x] Proposal creation and separate approval step in local demo state.
- [x] Synthetic-only and non-connected state disclosed in UI and README.
- [x] Windows-first product direction retained; Android remains later.
- [ ] Dependency install/build and manual accessibility review by the developer team.
- [ ] Production security controls, real speech, real integrations, backend, and desktop packaging.

## Source references

- [Tauri project creation](https://tauri.app/start/create-project/)
- [Tauri capabilities and permissions](https://tauri.app/security/capabilities/)
- [Tauri Windows installer guidance](https://v2.tauri.app/distribute/windows-installer/)
