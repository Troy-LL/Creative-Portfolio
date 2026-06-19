import { openMailto } from "../../core/open-external.js";

export function mountMobileMail(host) {
  host.innerHTML = `
    <p style="opacity:0.75;font-size:14px;margin-bottom:16px">Compose a message — opens your mail app (same as desktop Mail).</p>
    <form class="ios-mail-form" novalidate>
      <div class="ios-mail-field">
        <label for="iosMailTo">To</label>
        <input id="iosMailTo" name="to" type="email" readonly value="troylazaro09@gmail.com" autocomplete="off" />
      </div>
      <div class="ios-mail-field">
        <label for="iosMailSubject">Subject</label>
        <input id="iosMailSubject" name="subject" type="text" placeholder="Saying hello from your portfolio" autocomplete="off" />
      </div>
      <div class="ios-mail-field">
        <label for="iosMailBody">Message</label>
        <textarea id="iosMailBody" name="body" rows="6" placeholder="Write your message…"></textarea>
      </div>
      <button type="submit" class="ios-safari-open" style="width:100%;margin-top:8px">Send</button>
    </form>
  `;

  const form = host.querySelector(".ios-mail-form");
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
