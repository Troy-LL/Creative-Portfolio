import { openMailto } from "../core/open-external.js";

export function initMailApp() {
  const overlay = document.getElementById("mailOverlay");
  if (!overlay) return;

  const form = document.getElementById("mailComposeForm");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const to = String(fd.get("to") ?? "").trim();
    const subject = String(fd.get("subject") ?? "");
    const body = String(fd.get("body") ?? "");
    if (!to) return;
    openMailto(to, subject, body);
  });
}
