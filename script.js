/* ═══════════════════════════════════════════
   SQL TERMINAL PORTFOLIO — LOGIC
   ═══════════════════════════════════════════ */

// ── Native / Lenis Smooth Scroll ──
const terminalEl = document.getElementById('terminal');
let lenis = null;

function scrollDown() {
    // Keep terminal auto-scroll smooth using native behavior.
    // Lenis handles page-level smoothness separately.
    requestAnimationFrame(() => {
        terminalEl.scrollTo({
            top: terminalEl.scrollHeight,
            behavior: 'smooth'
        });
    });
}

// ── GSAP ──
gsap.registerPlugin(TextPlugin);

// ── DOM refs ──
const output = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const inputDisplay = document.getElementById('inputDisplay');

// ── Lenis + intro animations ──
window.addEventListener('DOMContentLoaded', () => {
    // Lenis: smooth page scrolling (in case content grows vertically)
    if (window.Lenis) {
        lenis = new Lenis({
            smoothWheel: true,
            smoothTouch: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // GSAP: subtle monitor entrance animation
    const monitor = document.querySelector('.monitor-bezel');
    if (monitor) {
        gsap.fromTo(
            monitor,
            { opacity: 0, scale: 0.96, y: 24 },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.6,
                ease: 'power3.out',
            }
        );
    }
});

// ── Window controls (close / minimize / maximize) ──
function initWindowControls() {
    const closeBtn = document.querySelector('.control.close');
    const minBtn = document.querySelector('.control.minimize');
    const maxBtn = document.querySelector('.control.maximize');
    const monitor = document.querySelector('.monitor-bezel');
    const desktop = document.getElementById('desktop');

    // CLOSE — keep existing shutdown behavior
    closeBtn?.addEventListener('click', () => {
        const terminal = document.getElementById('terminal');
        terminal.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        terminal.style.transform = 'scale(0.8) translateY(20px)';
        terminal.style.opacity = '0';
        terminal.style.filter = 'blur(10px)';

        setTimeout(() => {
            terminal.innerHTML = '<div class="shutdown-msg" style="color:red; font-size: 2rem; text-align:center; padding-top: 20vh;">SYSTEM HALTED</div>';
            terminal.style.opacity = '1';
            terminal.style.transform = 'none';
            terminal.style.filter = 'none';
        }, 600);
    });

    // MINIMIZE → macOS desktop
    minBtn?.addEventListener('click', () => {
        if (!monitor || !desktop) return;
        const isMinimized = monitor.classList.contains('is-minimized');
        if (!isMinimized) {
            minimizeToDesktop(monitor, desktop);
        } else {
            restoreFromDesktop(monitor, desktop);
        }
    });

    // MAXIMIZE — stretch monitor to viewport (no browser fullscreen)
    maxBtn?.addEventListener('click', () => {
        if (!monitor) return;
        const isMax = monitor.classList.toggle('is-maximized');
        document.body.style.overflow = isMax ? 'hidden' : 'auto';
    });
}

// Minimize: terminal out → desktop in
function minimizeToDesktop(monitor, desktop) {
    monitor.classList.add('is-minimized');
    desktop.classList.add('desktop--visible');

    if (lenis) lenis.stop();

    gsap.to(monitor, {
        opacity: 0,
        scale: 0.85,
        y: 60,
        duration: 0.38,
        ease: 'power3.in',
    });

    gsap.fromTo(
        desktop,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.15 }
    );

    gsap.fromTo(
        '.desktop-menubar',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.25 }
    );

    gsap.fromTo(
        '.desktop-icons-area .desktop-file-icon',
        { opacity: 0, y: 12 },
        {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.06,
            ease: 'power2.out',
            delay: 0.3,
        }
    );

    gsap.fromTo(
        '.desktop-dock',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)', delay: 0.3 }
    );
}

// Restore: desktop out → terminal in
function restoreFromDesktop(monitor, desktop, command = null) {
    gsap.to('.desktop-dock', {
        opacity: 0,
        y: 20,
        duration: 0.22,
        ease: 'power2.in',
    });
    gsap.to('.desktop-menubar', {
        opacity: 0,
        y: -8,
        duration: 0.22,
        ease: 'power2.in',
    });
    gsap.to('.desktop-icons-area .desktop-file-icon', {
        opacity: 0,
        y: 8,
        duration: 0.18,
        stagger: 0.04,
        ease: 'power2.in',
    });

    gsap.to(desktop, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        ease: 'power2.in',
        onComplete: () => {
            desktop.classList.remove('desktop--visible');
        },
    });

    monitor.classList.remove('is-minimized');

    gsap.fromTo(
        monitor,
        { opacity: 0, scale: 0.88, y: 50 },
        {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.3)',
            delay: 0.15,
            onComplete: () => {
                if (lenis) lenis.start();
                if (command) handleCommand(command);
                cmdInput.focus();
            },
        }
    );
}

// Desktop interactions: dock + icons
function initDesktopInteractions() {
    const monitor = document.querySelector('.monitor-bezel');
    const desktop = document.getElementById('desktop');
    const aboutOverlay = document.getElementById('aboutOverlay');
    if (!monitor || !desktop) return;

    document.querySelectorAll('.dock-icon').forEach((icon) => {
        icon.addEventListener('click', () => {
            const app = icon.dataset.app || null;
            const command = icon.dataset.command || null;

            // About app: open overlay on the desktop instead of restoring terminal
            if (app === 'about') {
                if (!aboutOverlay) return;
                aboutOverlay.classList.add('is-visible');
                gsap.fromTo(
                    '.about-window',
                    { opacity: 0, scale: 0.9, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.3)' }
                );
                return;
            }

            restoreFromDesktop(monitor, desktop, command || null);
        });
    });

    document.querySelectorAll('.desktop-file-icon').forEach((icon) => {
        // Single click: select
        icon.addEventListener('click', () => {
            document
                .querySelectorAll('.desktop-file-icon')
                .forEach((i) => i.classList.remove('selected'));
            icon.classList.add('selected');
        });

        // Double click: open
        icon.addEventListener('dblclick', () => {
            const command = icon.dataset.command || null;
            restoreFromDesktop(monitor, desktop, command || null);
        });
    });
}

// About app interactions
function initAboutApp() {
    const overlay = document.getElementById('aboutOverlay');
    if (!overlay) return;

    const windowEl = overlay.querySelector('.about-window');
    const closeDot = overlay.querySelector('.about-dot--close');

    function close() {
        gsap.to(windowEl, {
            opacity: 0,
            scale: 0.9,
            y: 18,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                overlay.classList.remove('is-visible');
            },
        });
    }

    closeDot?.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
    });

    // Click outside window closes as well
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
}

// Menubar clock
function initMenubarClock() {
    const clock = document.getElementById('menubarClock');
    if (!clock) return;

    function tick() {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }

    tick();
    setInterval(tick, 1000);
}

// Ensure controls and desktop are wired up once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    initWindowControls();
    initDesktopInteractions();
    initAboutApp();
    initMenubarClock();
});

// Keep focus on input
document.addEventListener('click', (e) => {
    // Don't steal focus if selecting text
    if (window.getSelection().toString()) return;
    cmdInput.focus();
});
cmdInput.focus();

// ── Mirror typed text into the visible display span ──
// CRITICAL: This makes the text visible and moves the cursor block!
cmdInput.addEventListener('input', () => {
    inputDisplay.textContent = cmdInput.value;
});

// ── Tab Autocomplete Logic ──
const KNOWN_COMMANDS = [
    'SELECT * FROM about',
    'SELECT * FROM resume',
    'SELECT * FROM experience',
    'SELECT * FROM education',
    'SELECT * FROM skills',
    'SELECT * FROM projects',
    'SELECT * FROM contact',
    'HELP',
    'CLEAR'
];

cmdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault(); // Stop focus change
        const current = cmdInput.value.toLowerCase();

        // Find match
        const match = KNOWN_COMMANDS.find(cmd => cmd.toLowerCase().startsWith(current));

        if (match) {
            cmdInput.value = match;
            inputDisplay.textContent = match; // Update mirror
        }
        return;
    }

    if (e.key !== 'Enter') return;
    const raw = cmdInput.value;
    cmdInput.value = '';
    inputDisplay.textContent = '';
    if (!raw.trim()) return;
    handleCommand(raw.trim());
});

// ── Command data (the "database") ──
const DATA = {
    about: [
        'BANNER: ABOUT THIS PROFILE',
        '',
        '  ┌────────────────────────────────────────────────────┐',
        '  │  Troy Lauren T. Lazaro                            │',
        '  │  IT Student • Community Leader                     │',
        '  └────────────────────────────────────────────────────┘',
        '',
        '  DEVICE           SQL_TERM v2.0 – Portfolio Terminal',
        '  USER             guest@portfolio',
        '  LOCATION         Caloocan, NCR, Philippines',
        '  STATUS           Open to opportunities',
        '',
        '  FOCUS            Leadership • Community Building',
        '                   Student Empowerment • Tech Advocacy',
        '',
        '  SUMMARY',
        '  A people‑first student leader focused on building',
        '  inclusive tech communities, designing growth',
        '  programs for students, and connecting people to',
        '  opportunities that match their potential.',
    ],
    experience: [
        'BANNER: LEADERSHIP & WORK EXPERIENCE',
        '',
        '  ► GDG on Campus – PUP (Manila)',
        '    Talent Development Lead | 2026 – Present',
        '    • Designed member growth programs',
        '    • tracked engagement and leadership pipelines',
        '',
        '    Talent Development Co-Lead | 2025 – 2026',
        '    • Facilitated capacity-building sessions',
        '    • Strengthened team cohesion',
        '',
        '    Talent Dev Associate | 2024 – 2025',
        '    • Organized community events',
        '',
        '  ► AWS Cloud Club – Philippines',
        '    Community Engagement Officer | 2025 – Present',
        '    • Led outreach to students & alumni',
        '    • Coordinated speakers for events',
        '',
        '  ► IBITS – PUP',
        '    Deputy Head, Comm. Involvement | Oct 2025 – Present',
        '',
        '  ► Microsoft Student Community – PUP',
        '    Exec. Secretary, Leadership Dev | 2025 – Present',
        '    • Oversaw documentation & scheduling',
        '    • Usher for "TechShift" event',
        '',
        '  ► DOST–PAGASA (Quezon City)',
        '    Intern | Apr 2023 – May 2023',
    ],
    education: [
        'BANNER: EDUCATION',
        '',
        '  ► Polytechnic University of the Philippines',
        '    Bachelor of Science in Information Technology',
        '    2024 – Present',
        '',
        '  ► National University – Fairview',
        '    2024',
    ],
    skills: [
        'BANNER: SKILLS & INTERESTS',
        '',
        '  Leadership :',
        '  People Management, Event Facilitation,',
        '  Member Development, Internal Training',
        '',
        '  Community :',
        '  Campaign Organizing, Partnerships,',
        '  Communication Strategy',
        '',
        '  Support :',
        '  Documentation, Executive Assistance,',
        '  Scheduling',
        '',
        '  Soft Skills :',
        '  Empathy, Adaptability, Initiative',
    ],
    contact: [
        'BANNER: CONTACT DETAILS',
        '',
        '  Phone    :  0975-644-6519',
        '  Email    :  troylazaro09@gmail.com',
        '  Address  :  Carmel Street, Caloocan, NCR',
    ],
    projects: [
        'BANNER: PROJECTS & CAMPAIGNS',
        '',
        '  • People’s Advocacies Campaign (JCO)',
        '    Campaigns for student empowerment & civic awareness.',
        '',
        '  • TechShift: Whirlpool of Innovation',
        '    Event coordination and ushering.',
        '',
        '  • Internal Capacity Building (GDG)',
        '    Training sessions for new officers.',
    ],
    resume: [
        'BANNER: FULL RESUME',
        '',
        '  (See specific sections: experience, education, skills)',
        '',
        '  ► EXPERIENCE',
        '    • Talent Development Lead @ GDG on Campus PUP (2026-)',
        '    • Community Engagement @ AWS Cloud Club PH (2025-)',
        '    • Deputy Head @ IBITS PUP (2025-)',
        '    • Exec. Secretary @ MSC PUP (2025-)',
        '    • Intern @ DOST-PAGASA (2023)',
        '',
        '  ► EDUCATION',
        '    • BS IT @ PUP (2024-Present)',
        '',
        '  ► SKILLS',
        '    • Leadership, Community Organizing, Documentation',
        '',
        '  ► CONTACT',
        '    • troylazaro09@gmail.com | 0975-644-6519',
    ],
    help: [
        'BANNER: AVAILABLE COMMANDS',
        '',
        '  COMMAND                       DESCRIPTION',
        '  ───────                   ───────────',
        '  SELECT * FROM about           Bio & Status',
        '  SELECT * FROM experience      Leadership roles',
        '  SELECT * FROM education       Academic history',
        '  SELECT * FROM skills          Core competencies',
        '  SELECT * FROM projects        Campaigns/Events',
        '  SELECT * FROM contact         Contact info',
        '  HELP                          Show this guide',
        '  CLEAR                         Clear terminal',
        '',
    ],
};

// ── Command router ──
function handleCommand(raw) {
    // Echo the typed command
    appendLine(`guest@portfolio ~> ${raw}`, 'green');

    const cmd = raw.toLowerCase().trim();

    if (cmd === 'clear') {
        output.innerHTML = '';
        scrollDown();
        return;
    }

    if (cmd === 'help' || cmd === '?') {
        renderResult(DATA.help);
        return;
    }

    // SELECT * FROM <table>
    const match = cmd.match(/^select\s+\*\s+from\s+(\w+)$/);
    if (match) {
        const table = match[1];
        if (DATA[table]) {
            // Simulate query feedback
            appendLine('', '');
            appendLine(`Executing: SELECT * FROM ${table}`, 'dim');
            appendLine(`${DATA[table].length} row(s) returned.`, 'dim');
            appendLine('', '');
            renderResult(DATA[table]);
            return;
        } else {
            appendLine('', '');
            appendLine(`ERROR 1146: Table '${table}' doesn't exist.`, 'error');
            appendLine(`Available tables: about, experience, education, skills, projects, contact, resume`, 'dim');
            appendLine('', '');
            scrollDown();
            return;
        }
    }

    // Unknown command
    appendLine('', '');
    appendLine(`ERROR: Unrecognized command.`, 'error');
    appendLine(`Type HELP for available commands.`, 'dim');
    appendLine('', '');
    scrollDown();
}

// ── Render helpers ──
function appendLine(text, cls) {
    const pre = document.createElement('pre');
    pre.className = `line ${cls || ''}`;
    pre.textContent = text;
    output.appendChild(pre);
}

function renderResult(lines) {
    const fragment = document.createDocumentFragment();
    lines.forEach((text) => {
        if (text.startsWith('BANNER:')) {
            const div = document.createElement('div');
            div.className = 'terminal-banner animated-item';
            div.textContent = text.replace('BANNER:', '').trim();
            div.style.opacity = '0';
            div.style.transform = 'translateX(-8px)';
            fragment.appendChild(div);
        } else {
            const pre = document.createElement('pre');
            pre.className = 'line green animated-item';
            pre.textContent = text;
            pre.style.opacity = '0';
            pre.style.transform = 'translateX(-8px)';
            fragment.appendChild(pre);
        }
    });
    output.appendChild(fragment);

    // Staggered reveal with GSAP
    const newLines = output.querySelectorAll('.animated-item[style*="opacity: 0"]');
    gsap.to(newLines, {
        opacity: 1,
        x: 0,
        duration: 0.15,
        stagger: 0.03,
        ease: 'power2.out',
        onUpdate: scrollDown,
        onComplete: () => {
            // Clean up inline styles after animation
            newLines.forEach(el => {
                el.style.opacity = '';
                el.style.transform = '';
                el.classList.remove('animated-item');
            });
            scrollDown();
        },
    });

    appendLine('', '');
    scrollDown();
}
