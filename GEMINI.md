# Project: Creative Portfolio (Portfolio OS)

A macOS-inspired creative portfolio website designed to look and feel like a desktop operating system. It features a desktop environment with draggable windows, a dock, a terminal, and several built-in apps.

## Architecture & Technologies

### Core Stack
- **Frontend:** HTML5, Vanilla CSS, Vanilla JS (ES6+)
- **Animation:** [GSAP](https://gsap.com/) & [TextPlugin](https://gsap.com/docs/v3/Plugins/TextPlugin/)
- **Interactions:** [GSAP Draggable](https://gsap.com/docs/v3/Plugins/Draggable/) for window management.
- **Scrolling:** [Lenis](https://lenis.darkroom.engineering/) for smooth scroll.
- **Deployment:** Vercel (configured via `vercel.json` with strict security headers).

### Modular Structure (`assets/js/`)
- **`bootstrap/`**: Initialization logic for the app shell and splash screen.
- **`core/`**: Shared state (terminal DOM refs, Lenis instance).
- **`data/`**: Centralized content, specifically `portfolio-data.js` for the terminal database.
- **`desktop/`**: Logic for OS features (Finder, Safari, Mail, Contacts, Settings, Control Center, window focus).
- **`terminal/`**: Command input and processing logic.

### Sub-projects
- **Founders Cafe (`founders-cafe/`)**: A standalone React/Vite project. It is built into `assets/founders-cafe/` and displayed within the "Safari" app in the main shell.

## Building and Running

### Commands
- **Install Dependencies (Root):** `npm install` (Note: Root has no direct dependencies other than the build script).
- **Build Entire Project:** `npm run build`
  - This runs `node scripts/build-founders-cafe.cjs`, which builds the `founders-cafe` sub-project.
- **Sub-project Development:**
  ```bash
  cd founders-cafe
  npm install
  npm run dev
  ```
- **Build Sub-project:**
  ```bash
  cd founders-cafe
  npm run build
  ```

### Development Note
The project relies on ES modules. For local development, use a local server (e.g., Live Server in VS Code or `npx serve .`) to avoid CORS issues and ensure module loading works correctly.

## Development Conventions

### Content Management
- **Terminal Data:** Update `assets/js/data/portfolio-data.js` to change the "database" content for the terminal.
- **Images/Icons:** Stored in `assets/img/`. App icons follow a macOS-like structure under `assets/img/app-icons/`.

### UI/UX Philosophy
- **Authenticity:** The UI mimics macOS Ventura/Sonoma styling (windows, dots, dock, control center).
- **Interactivity:** Every window is draggable. The "Safari" app serves as a container for web demos.
- **Accessibility:** ARIA labels and roles are used throughout `index.html`, though many features are intentionally "ui-chrome--inactive" (decorative).

### Styling
- CSS is organized by component (e.g., `monitor.css`, `desktop.css`, `terminal.css`).
- Uses CSS variables for themes and appearance (see `assets/css/desktop/desktop-variables.css`).
