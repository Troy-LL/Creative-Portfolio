# Design Philosophy

This document records how UI decisions are made for this portfolio OS project.

## Core Direction

- Blend macOS inspiration with original portfolio identity.
- Use references as guidance, not strict copies.
- Keep everything functional-looking, even when features are not yet implemented.
- Prioritize immersive consistency across apps (Finder, Settings, Contacts, Mail, etc.).

## Visual Principles

- Soft depth over heavy skeuomorphism: subtle shadows, layered panes, clean separators.
- Rounded geometry and tight spacing similar to desktop-native apps.
- Typography hierarchy should be clear at a glance: title, subtext, metadata, actions.
- Accent color (`--sys-color`) drives active/focus states across all apps.
- Dark and light themes must both feel intentional, never like inverted afterthoughts.

## Interaction Principles

- Controls should look native first, then branded second.
- Every icon button should be built with inline SVG for consistency and theme control.
- Interactive controls must have hover/active visual feedback.
- Decorative or future controls should remain visible but inactive to preserve immersion.

## SVG-First Button Rule

- Prefer inline SVG for all internal action buttons and toolbar controls.
- Use `stroke="currentColor"` and `fill="none"` unless a filled icon is explicitly needed.
- Keep icon sizing consistent per context (toolbar vs. action bubble vs. list glyph).
- Avoid raster icons for controls unless there is a strong content reason.

## Inactive Placeholder Rule

- If a feature exists visually but has no behavior yet, mark it as intentionally inactive.
- Use the existing inactive treatment (`ui-chrome--inactive`, muted colors, disabled cursor).
- Keep placeholder controls discoverable but non-deceptive (`aria-disabled="true"`).
- If a control is grayed out, it must not prompt interaction: no pointer cursor, no hover lift/glow, no focus ring, and no click/tap behavior.
- Do not remove these controls just because they are not wired yet; they support OS realism.

## Reference-Driven Workflow

- Start with a trusted visual reference (layout, rhythm, component style).
- Translate reference patterns into this project’s component naming and CSS system.
- Keep unique project personality in copy, content, and motion behavior.
- Avoid pixel-perfect cloning; aim for recognizable inspiration plus original execution.

## Content Philosophy

- The portfolio is both informative and expressive.
- App surfaces should communicate story, intent, and personality (not only data).
- Keep text concise, but allow selected spaces (like Settings > General) to carry narrative context.

## Implementation Checklist (Per Screen)

- Toolbar icons are SVG-based.
- Unimplemented controls are visibly grayed out.
- Grayed-out controls never look clickable or interactive.
- Theme parity checked in both dark and light mode.
- Mobile behavior remains readable and touch-friendly.
- Link CTAs are explicit and open safely (`rel="noopener noreferrer"` for external links).

## Common Pitfalls and Reminders

- New apps must be wired in all three layers: `index.html` (overlay markup), `interactions/init` (open lifecycle), and dedicated app module (close/min behavior).
- New app CSS must be imported in `assets/css/desktop.css`; otherwise the app can render unstyled or appear broken.
- New windows must be registered in `window-focus.js` so drag, focus z-index, and menubar app name work correctly.
- Traffic-light controls must use `.mac-close`, `.mac-min`, `.mac-max` and app-specific dot classes (e.g. `.safari-dot`) with focus/unfocus support.
- If an element in reference is a temporary popup/context menu, do not embed it as permanent layout content.
- Validate window bounds/position early (center or bounded placement) to avoid clipping outside the desktop scene.
- Avoid duplicate open handlers for one app; choose one source of truth to prevent silent conflicts.
- After adding or refactoring UI blocks, remove dead CSS/markup immediately to keep styles maintainable.
