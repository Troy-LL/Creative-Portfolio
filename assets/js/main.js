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

