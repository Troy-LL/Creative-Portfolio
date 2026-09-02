# AGENT CONTEXT — iOS Mobile Layer for Creative Portfolio

## Project Overview
This is a macOS-inspired creative portfolio OS built with vanilla HTML/CSS/JS.
The full structure lives in a single `index.html` (2086 lines) with CSS split across
`assets/css/` (base, desktop, monitor, terminal, mail, splash) and JS in `scripts/` and `assets/js/`.
Animations use GSAP + Draggable. Smooth scroll uses Lenis. Hosted on Vercel.

The existing experience is intentionally designed as a **desktop OS simulation** —
draggable windows, a dock, a macOS menu bar, and app overlays (Terminal, Finder,
Settings, Contacts, Mail). The desktop metaphor MUST be preserved for ≥ 1024px viewports.

---

## Your Task: Add a Full iOS-Style Mobile Experience

When `window.innerWidth < 768px` (or on touch devices), render a completely separate
**iOS Home Screen** experience instead of the macOS desktop. Do NOT scale or squish
the existing desktop layout — detect the viewport and swap rendering modes entirely.

### Detection Strategy
In `scripts/` or a new `assets/js/mobile/init.js`, add a mobile init module:
```js
const isMobile = () => window.innerWidth < 768 || ('ontouchstart' in window);
```
In `index.html`, add `<body class="...">` logic or a JS bootstrap that applies
`data-view="mobile"` vs `data-view="desktop"` on `<html>`. All mobile CSS should
scope under `[data-view="mobile"]` or inside `@media (max-width: 767px)` blocks
in a new file: `assets/css/mobile.css`.

---

## iOS UI Elements to Build

### 1. Lock Screen → Home Screen Boot
- Replace `#bootSplash` on mobile with an iOS-style lock screen:
  - Blurred wallpaper background
  - Time (large, SF Pro–style, use `font-family: -apple-system, BlinkMacSystemFont`)
  - Date below the time
  - Swipe-up or tap gesture to unlock → transition to Home Screen
  - Reuse the existing boot progress logic but adapt the visual

### 2. iOS Home Screen
- Full-screen wallpaper (reuse the existing `--wallpaper-*` CSS variables or default gradient)
- **Status bar** across the top: time left, signal/wifi/battery icons right (SVG, decorative)
- **App icon grid**: 4-column grid of app icons, centered, with labels below — same apps as
  the dock (Terminal, Finder, Safari, Settings, Mail, Contacts)
- Use the existing icon images already in `assets/img/app-icons/`
- Tap an icon → open the corresponding iOS-style "app sheet"
- **Dock bar** pinned to the bottom: Terminal, Finder, Safari, Mail (frosted glass style,
  `backdrop-filter: blur(20px); background: rgba(255,255,255,0.15)`)

### 3. App Sheets (Full-Screen Modal, iOS style)
Each app opens as a full-screen sheet that slides up from the bottom:
transform: translateY(100%) → translateY(0) — 350ms ease-out
Each sheet has:
- A **pill handle** at the top center (drag down to close)
- An **iOS navigation bar**: back chevron `‹` left, app name center, optional action right
- Content area (scrollable, `-webkit-overflow-scrolling: touch`)
- Close on swipe-down gesture (track `touchstart` / `touchmove` / `touchend` delta)

**App content mapping (keep content identical to desktop counterpart):**
- **Terminal** → Show the SQL terminal interface, adapted for touch. Replace keyboard-typed
  input with a scrollable command palette of pre-set queries (e.g. `SELECT * FROM resume`,
  `SELECT * FROM projects`, `SELECT * FROM contact`) as tappable chips above a text input.
- **Finder** → Show the Resume and Projects folder icons as iOS-style list rows; tap to open
  the viewer content.
- **Settings** → Render the existing Settings panels (Appearance, General) as iOS Settings-style
  grouped table views with toggle rows and segmented controls.
- **Mail** → Show the Mail compose/list interface adapted for single-column layout.
- **Contacts** → Show Troy's contact card in iOS Contacts style (large avatar, quick-action
  buttons: message, phone, video, mail).
- **Safari** → Show a simple address bar with the Vercel portfolio URL and a tappable "Open"
  button that opens `https://tlportfolio.vercel.app/` in a new tab.

### 4. iOS Typography & Spacing Rules
- `font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif`
- Navigation bar title: `font-size: 17px; font-weight: 600`
- Body text: `font-size: 15–17px`
- Minimum tap target: `44px × 44px`
- Section headers in lists: `11px uppercase, letter-spacing: 0.06em, color: var(--sys-muted)`
- Grouped list rows: `48px min-height`, separator lines `0.5px solid rgba(128,128,128,0.3)`

### 5. Gesture Support
- Swipe down on any open app sheet → close it (return to home)
- Swipe left/right on the home screen → page through app icon pages (if more than one page)
- Long-press on app icons → wiggle mode (decorative, icons shake, no delete needed)
- All touch events must use `passive: true` listeners where possible

### 6. Dynamic Island (optional, nice-to-have)
On screens ≥ 390px wide, render a decorative Dynamic Island pill at the top center
of the lock screen and home screen (purely decorative, `position: fixed; top: 12px`).

---

## CSS Architecture Rules (from design-philosophy.md)
- Scope ALL mobile styles in `assets/css/mobile.css` — import it last in `index.html`
  after all existing stylesheets.
- Use `--sys-color` (already defined) for accent color consistency.
- Dark/light theme parity is required: mobile styles must respect the existing
  `[data-theme="dark"]` / `[data-theme="light"]` attributes set by Settings.
- No new external dependencies — use GSAP (already loaded) for sheet animations if needed,
  or native CSS transitions.
- All interactive mobile controls must have `:active` visual feedback (scale/opacity).

---

## File Wiring Checklist (from design-philosophy.md)
New mobile layer must be registered in:
1. `index.html` — add `<link rel="stylesheet" href="assets/css/mobile.css" />` and
   the `<script src="assets/js/mobile/init.js" defer></script>` tag
2. `assets/js/mobile/init.js` — bootstrap: detect viewport, set `data-view`, inject
   mobile DOM if needed, import app sheet modules
3. `assets/js/mobile/sheets.js` — sheet open/close/gesture logic
4. `assets/js/mobile/apps/` — one file per app (terminal.js, finder.js, settings.js, etc.)
5. Do NOT touch or break any existing desktop JS modules

---

## Constraints & Non-Negotiables
- The macOS desktop experience must be **completely unaffected** at ≥ 768px.
- No layout shift, no new CSS leaking into desktop breakpoints.
- All existing `window-focus.js`, `Draggable`, and desktop overlay logic stays untouched.
- Mobile must handle both portrait and landscape orientations gracefully.
- The boot splash (`#bootSplash`) already exists — on mobile, add a CSS override to
  give it an iOS lock screen appearance without removing or renaming the element.
- Accent color changes in Settings must propagate to mobile UI via the same
  `--sys-color` CSS variable already used desktop-side.