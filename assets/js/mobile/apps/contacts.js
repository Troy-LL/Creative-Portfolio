const ICON = {
  message: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.4a2 2 0 0 1-.45 2.11L7.1 9.9a16 16 0 0 0 6 6l1.67-1.1a2 2 0 0 1 2.12-.45c.79.24 1.58.42 2.4.54A2 2 0 0 1 22 16.92z"/></svg>`,
  video: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="14" height="10" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>`,
};

export function mountMobileContacts(host) {
  const phone = "09756446519";
  const mail = "troylazaro09@gmail.com";

  host.innerHTML = `
    <div class="ios-contacts-hero">
      <div class="ios-contacts-avatar" aria-hidden="true">TL</div>
      <div class="ios-contacts-name">Troy Lauren T. Lazaro</div>
      <div style="opacity:0.7;margin-top:4px;font-size:15px">IT Student · Caloocan, NCR</div>
      <div class="ios-contacts-actions">
        <a href="sms:${phone}">
          <span class="ios-ca-circle">${ICON.message}</span>
          message
        </a>
        <a href="tel:${phone}">
          <span class="ios-ca-circle">${ICON.phone}</span>
          phone
        </a>
        <button type="button" class="ios-contact-video" data-video>
          <span class="ios-ca-circle">${ICON.video}</span>
          video
        </button>
        <a href="mailto:${mail}">
          <span class="ios-ca-circle">${ICON.mail}</span>
          mail
        </a>
      </div>
    </div>
    <div class="ios-list-section">
      <div class="ios-list-header">Details</div>
      <div class="ios-list-group">
        <div class="ios-settings-toggle" style="cursor:default">
          <span>Phone</span>
          <span style="font-weight:500">${phone}</span>
        </div>
        <div class="ios-settings-toggle" style="cursor:default;border-bottom:none">
          <span>Email</span>
          <span style="font-weight:500;font-size:14px">${mail}</span>
        </div>
      </div>
    </div>
  `;

  host.querySelector("[data-video]")?.addEventListener("click", () => {
    window.location.href = `tel:${phone}`;
  });
}
