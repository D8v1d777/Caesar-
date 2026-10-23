# Built-in Onboarding and Tutorial

## Goal

A first-time user should create and approve a useful visual without learning prompt engineering. Tutorial content must be part of the product, not a link to an external document alone.

## First-run flow

### Step 1 — Welcome
Explain Caesar in one sentence: “Turn what you say into visuals you can trust.” Offer Start setup and Explore a sample.

### Step 2 — Privacy controls
Explain when the microphone is active, where processing occurs, what may be sent to company infrastructure, and what is not retained by default. Show the listening indicator and mute control. Never imply that all processing is local unless the selected deployment verifies that claim.

### Step 3 — Connect
Authenticate against the company service or choose the synthetic demo workspace. Show clear connection status and what the current account is allowed to access.

### Step 4 — Microphone check
Let the user grant OS microphone permission, speak a short sample, inspect the transcript, and discard it. Do not store the sample by default.

### Step 5 — Guided request
Use synthetic data and a deterministic example:
“Compare quarterly revenue by region.”
Explain how a spoken request becomes a proposal, how the source and period are shown, and why the screen does not change automatically.

### Step 6 — Review and approve
Highlight the proposed chart, source details, Approve, Edit, and Reject controls. Require the user to choose. Explain that approval applies only to this proposal.

### Step 7 — Refine
Teach “Change to a line chart,” “Undo,” “Show the previous version,” and “Cancel.” Every tutorial action is reversible.

### Step 8 — Export
Show the available export formats. Explain which outputs are editable and whether provenance/source notes are included.

### Step 9 — Integrations
Demonstrate opening Integrations, reviewing a permission list, and distinguishing available connectors from planned ones. Do not install a real connector without explicit user consent.

### Step 10 — Completion
Offer a short keyboard-shortcut reference, privacy settings, replay tutorial, and skip/continue choices.

## Contextual help

- Empty state: show three sample requests and a demo-data action.
- First proposal: explain source, period, freshness, and approval.
- First integration: explain publisher verification and permission scopes.
- Offline state: explain what works locally and what requires the company service.
- Validation failure: explain why a result was blocked without exposing sensitive diagnostics.

## Tutorial implementation requirements

- Tutorials use versioned steps so changed workflows can be re-taught.
- Users can skip, pause, resume, replay, or disable contextual hints.
- Tutorial progress is local by default; sync only if the organization explicitly enables it.
- Use synthetic data only.
- Support keyboard, screen reader, zoom, reduced motion, and localization-ready strings.
- Do not force a tutorial modal over an active presentation.
- Tutorial completion is not a security approval and never grants permissions.

## Acceptance criteria

A first-time user can finish the guided flow, create a visual from synthetic data, inspect its provenance, approve or reject it, undo a change, and export the result without writing a complex prompt.
