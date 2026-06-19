import { copyText } from "../../core/copy-text.js";

const ICON = {
  message: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.4a2 2 0 0 1-.45 2.11L7.1 9.9a16 16 0 0 0 6 6l1.67-1.1a2 2 0 0 1 2.12-.45c.79.24 1.58.42 2.4.54A2 2 0 0 1 22 16.92z"/></svg>`,
  video: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="14" height="10" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
};

const COPY_RESET_MS = 2000;

export function mountMobileContacts(host) {
  const phone = "09756446519";
  const mail = "troylazaro09@gmail.com";

  const actions = [
    { key: "message", label: "message", value: phone, hint: "Phone number" },
    { key: "phone", label: "phone", value: phone, hint: "Phone number" },
    { key: "video", label: "video", value: phone, hint: "Phone number" },
    { key: "mail", label: "mail", value: mail, hint: "Email address" },
  ];

  const actionButtons = actions
    .map(
      ({ key, label }) =>
        `<button type="button" class="ios-contact-action" data-copy-key="${key}" aria-label="Copy ${label}">
          <span class="ios-ca-circle" data-icon-wrap>${ICON[key]}</span>
          <span class="ios-contact-action__label" data-label>${label}</span>
        </button>`,
    )
    .join("");

  host.innerHTML =
    '<section class="ios-contacts-hero">' +
    '<figure class="ios-contacts-avatar">' +
    '<img src="assets/img/Troy.jfif" alt="Troy Lauren T. Lazaro" width="112" height="112" decoding="async" />' +
    "</figure>" +
    '<h3 class="ios-contacts-name">Troy Lauren T. Lazaro</h3>' +
    '<p class="ios-contacts-subtitle">IT Student · Caloocan, NCR</p>' +
    '<p class="ios-contacts-copy-hint" id="iosContactsCopyHint" aria-live="polite"></p>' +
    '<div class="ios-contacts-actions">' +
    actionButtons +
    "</div>" +
    "</section>" +
    '<div class="ios-list-section">' +
    '<div class="ios-list-header">Details</div>' +
    '<div class="ios-list-group">' +
    '<div class="ios-settings-toggle" style="cursor:default">' +
    "<span>Phone</span>" +
    '<span style="font-weight:500">' +
    phone +
    "</span>" +
    "</div>" +
    '<div class="ios-settings-toggle" style="cursor:default;border-bottom:none">' +
    "<span>Email</span>" +
    '<span style="font-weight:500;font-size:14px">' +
    mail +
    "</span>" +
    "</div>" +
    "</div>" +
    "</div>";

  const actionMap = Object.fromEntries(actions.map((a) => [a.key, a]));
  const hintEl = host.querySelector("#iosContactsCopyHint");
  const timers = new Map();

  const resetAction = (btn) => {
    const key = btn.dataset.copyKey;
    const { label } = actionMap[key];
    btn.classList.remove("ios-contact-action--copied");
    btn.querySelector("[data-label]").textContent = label;
    btn.querySelector("[data-icon-wrap]").innerHTML = ICON[key];
    btn.setAttribute("aria-label", `Copy ${label}`);
  };

  host.querySelectorAll(".ios-contact-action").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.copyKey;
      const action = actionMap[key];
      if (!action) return;

      const ok = await copyText(action.value);
      const prev = timers.get(btn);
      if (prev) clearTimeout(prev);

      if (ok) {
        btn.classList.add("ios-contact-action--copied");
        btn.querySelector("[data-label]").textContent = "Copied!";
        btn.querySelector("[data-icon-wrap]").innerHTML = ICON.check;
        btn.setAttribute("aria-label", `${action.hint} copied`);
        if (hintEl) hintEl.textContent = `${action.hint} copied to clipboard`;
      } else if (hintEl) {
        hintEl.textContent = "Could not copy — select and copy manually";
      }

      timers.set(
        btn,
        window.setTimeout(() => {
          resetAction(btn);
          if (hintEl?.textContent.includes("copied")) hintEl.textContent = "";
          timers.delete(btn);
        }, COPY_RESET_MS),
      );
    });
  });
}
