# Caesar UI/UX Specification

**Quality target:** premium, original, precise, calm, accessible  
**Platform sequence:** Windows desktop first; Android second  
**Status:** Direction and acceptance criteria; final tokens must be validated in a coded visual prototype.

## 1. Design intent

Caesar should feel like a considered professional instrument: quiet confidence, exceptional hierarchy, fast feedback, and a workspace that keeps attention on the presentation. Aim for the craft and consistency associated with leading consumer software without copying proprietary interfaces, assets, or exact layouts.

Avoid generic “AI app” patterns: noisy gradient backgrounds, glowing borders everywhere, excessive glass blur, dense cards, tiny gray text, random emoji icons, and motion that competes with content.

## 2. Visual system

- Use a restrained neutral base with one distinctive Caesar accent and semantic colors reserved for status.
- Support light and dark themes with tested contrast.
- Use a consistent spacing scale, typography hierarchy, radii, border weights, elevation, and icon family.
- Use real layout primitives and design tokens; do not hardcode one-off values in every component.
- Prefer clear surfaces and subtle depth over excessive glassmorphism.
- Use high-quality charts with readable axes, restrained gridlines, direct labels where appropriate, and accessible non-color encodings.
- Never rely on color alone to communicate approval, error, or data freshness.

Initial proposed direction: warm-neutral or graphite workspace, bright readable canvas, crisp typography, restrained accent, and a presentation-first central area. Final palette and typography are a design-spike decision, not an existing brand commitment.

## 3. Windows desktop information architecture

Primary navigation:
- Home / Recent
- Create
- Presentation workspace
- Integrations
- Templates
- Tutorials / Help
- Settings

Presentation workspace:
- Top bar: session status, source/data freshness, undo/redo, present/export.
- Main canvas: current slide or visualization with generous breathing room.
- Context panel: current request, proposed edits, source/provenance, and approval controls.
- Voice control: obvious listening/muted state and a direct stop control.
- Preview state: clearly distinguish proposed changes from the currently displayed presentation.

Avoid persistent sidebars that consume too much canvas space. Panels should be collapsible and keyboard accessible.

## 4. Core screens

1. Welcome / privacy promise.
2. Setup: microphone test, company service connection, identity sign-in, permitted processing mode.
3. Interactive tutorial.
4. Home / recent projects.
5. Create workspace.
6. Presentation editor / live presentation canvas.
7. Proposal and approval preview.
8. Data source / metric provenance view.
9. Integration catalog.
10. Integration detail and permission grant.
11. Integration configuration and connection test.
12. Template gallery.
13. Export dialog.
14. Settings: privacy, session, audio, data sources, integrations, accessibility, theme, diagnostics.
15. Error and offline states.

## 5. Interaction rules

- Listening is always explicit and visible.
- Contextual suggestions never change the presentation automatically.
- Distinguish “suggestion,” “preview,” “approved,” “loading,” “displayed,” and “failed.”
- Approval controls describe the action and data scope, not vague “Continue” copy.
- A material change after approval requires a new approval.
- Provide undo for supported presentation changes and clear cancellation for pending actions.
- Never show fake progress; use stage-specific progress and cancellation where possible.
- Errors explain what happened, what remains safe, and the next recovery action.
- Show source, period, and freshness beside or directly accessible from data-backed visuals.
- Support keyboard-only operation, visible focus, logical focus order, screen readers, scalable text, and reduced motion.

## 6. Motion and feedback

Use motion to establish cause and effect: subtle panel transitions, restrained chart entrance, clear approval feedback. Respect reduced-motion preferences. Avoid long intro animations, looping decorative motion, and layout shifts that make a live presentation unstable.

## 7. Android follow-on

Android must be designed after Windows MVP validation. Reuse brand tokens, action contracts, API semantics, and tutorial content, but use native-feeling touch targets, system permission prompts, mobile navigation, lifecycle-safe session handling, and clear background microphone restrictions. Do not promise continuous background listening without a compliant, user-visible Android design.

## 8. UI acceptance checklist

- Consistent typography, spacing, iconography, and component states.
- No overflow at supported Windows window sizes or display scaling.
- All major workflows work with keyboard only.
- Visible focus and meaningful accessible names.
- Empty, loading, error, offline, denied, stale-data, and success states designed.
- No unapproved display changes.
- Data provenance discoverable without obscuring the story.
- Contrast and color-independent status cues verified.
- Reduced-motion behavior verified.
- Screenshots and visual QA evidence included in UI pull requests.
