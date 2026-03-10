const terminalEl = document.getElementById('terminal');
let lenis = null;
gsap.registerPlugin(TextPlugin);
const output = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const inputDisplay = document.getElementById('inputDisplay');
function scrollDown() {
    requestAnimationFrame(() => {
        terminalEl.scrollTo({ top: terminalEl.scrollHeight, behavior: 'smooth' });
    });
}
