/**
 * Open external URLs without navigating the portfolio page away.
 * https: new tab · mailto/tel/sms: system handler via native <a> click
 */
export function buildMailtoUrl(to, subject = "", body = "") {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${to}${qs ? `?${qs}` : ""}`;
}

export function openExternal(url) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  if (/^https?:/i.test(url)) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function openMailto(to, subject = "", body = "") {
  openExternal(buildMailtoUrl(to, subject, body));
}
