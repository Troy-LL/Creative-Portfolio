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
