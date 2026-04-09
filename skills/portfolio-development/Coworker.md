---
name: portfolio-development
description: Guidelines and standards for maintaining Troy Lazaro's macOS-CRT Portfolio. Use this skill when: (1) Creating or updating simulated "applications" on the desktop, (2) Modifying the SQL Terminal behavior, (3) Adding new project data to the simulated Finder or Terminal, or (4) Ensuring the high-fidelity CRT/macOS aesthetic is preserved.
---

# Portfolio Development Guide

This skill ensures that the **Troy Lazaro Portfolio** maintains its unique high-fidelity aesthetic (macOS Ventura inside a CRT monitor) and consistent interactive behavior.

## Core Philosophy
The portfolio is not just a website; it's a **simulation**. Every addition should reinforce the immersion of using a retro-modern workstation.

## ✅ What to Do

### Technical Standards
*   **Vanilla First**: Use HTML5, Vanilla CSS, and ES6+ JavaScript. Avoid frameworks (React/Vue) unless explicitly requested for a standalone sub-project.
*   **GSAP for Motion**: Use GSAP for all window animations. Windows should have a "spring" feel (back.out ease) and include scale/opacity transitions.
*   **State Awareness**: Ensure the system handles transitions between the Terminal (SQL_TERM) and the Desktop correctly.
    *   **Minimize**: Keeps state (input progress).
    *   **Close**: Resets state.
*   **Responsive Iframes**: When embedding projects (Wordle, FlavorMapping), ensure they are scaled correctly within the `preview-window`. Use the `is-wordle` class pattern in `assets/js/desktop/viewers.js` if necessary to apply custom scaling.
*   **SEO & Titles**: The title should remain `TLPortfolio` as established in latest iterations.

### Aesthetic Standards
*   **macOS Emulation**: Follow macOS Ventura UI patterns for window controls (Red/Yellow/Green dots), sidebars (vibrant blur), and icons.
*   **CRT Immersion**: Keep the scanlines, flicker, and bezel layers intact. Anything "inside" the screen should feel like it's behind glass.
*   **Light Theme by Default**: Ship without `dark-theme` on `<body>`; the Control Center toggle adds it for dark mode.

## ❌ What NOT to Do

### Avoid These Pitfalls
*   **Don't Use Generic Colors**: Avoid standard `red`, `blue`, or `green`. Use the HEX codes defined in `--sys-color` or the Control Center palette.
*   **Don't Break Smooth Scrolling**: Never use standard browser scrollbars in windows. Use `data-lenis-prevent` on scrollable containers and rely on the global Lenis instance.
*   **Don't Add Heavy Assets**: Keep image assets optimized. Use `.webp` or compressed `.png`/`.jpg` where possible.
*   **Don't Bypass the "Monitor"**: Avoid putting elements outside the `monitor-bezel` unless they are part of the "real world" background.
*   **Don't Hardcode Data**: Content for the terminal should reside in `assets/js/data/portfolio-data.js`. Do not hardcode long text strings directly into `assets/js/terminal/commands.js`.

## Specialized Workflows

### Adding a New Project
1.  **Update Data**: Add the project entry to `DATA.projects` in `assets/js/data/portfolio-data.js`.
2.  **Finder Icon**: Add the icon logic to `initFinderApp()` in `assets/js/desktop/finder.js`.
3.  **Documentation**: Update `Documentation/Project_Overview.md` to reflect the new addition.
4.  **Scaling**: If it's a web app, test it in the `openPdfViewer` iframe and adjust scaling if the UI gets cutoff.

### Maintenance
*   **Netlify Functions**: If optimizing serverless functions, implement lazy loading for heavy libraries (NLTK, etc.) to reduce cold starts.
*   **Tab Titles**: Always check `index.html` for the canonical brand name (`TLPortfolio`).

---
> [!TIP]
> Refer to [Visual Standards](references/visual-standards.md) for specific color hex codes and GSAP easing curves.
