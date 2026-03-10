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
