export function mountMobileFinder(host) {
  const renderHome = () => {
    host.innerHTML = `
      <div class="ios-list-section">
        <div class="ios-list-header">Browse</div>
        <div class="ios-list-group">
          <button type="button" class="ios-list-row" data-action="pdf">
            <img src="assets/img/Document.png" alt="" width="40" height="40" />
            <div>
              <div><strong>Resume - Troy.pdf</strong></div>
              <div style="font-size:13px;opacity:0.65">PDF document</div>
            </div>
          </button>
          <button type="button" class="ios-list-row" data-action="projects">
            <img src="assets/img/folder.png" alt="" width="40" height="40" />
            <div>
              <div><strong>Projects</strong></div>
              <div style="font-size:13px;opacity:0.65">Folder</div>
            </div>
          </button>
        </div>
      </div>
    `;

    host.querySelector('[data-action="pdf"]')?.addEventListener("click", () => {
      window.openPdfViewer?.("assets/img/Resume - Troy.pdf", "Resume - Troy.pdf");
    });

    host.querySelector('[data-action="projects"]')?.addEventListener("click", () => {
      renderProjects();
    });
  };

  const renderProjects = () => {
    host.innerHTML = `
      <div class="ios-list-section">
        <div class="ios-list-header">Projects</div>
        <div class="ios-list-group">
          <button type="button" class="ios-list-row" data-action="back" style="color:var(--sys-color,#007aff)">
            ‹ Back
          </button>
          <button type="button" class="ios-list-row" data-action="empty">
            <img src="assets/img/folder.png" alt="" width="40" height="40" />
            <div><strong>Passion Fueled</strong></div>
          </button>
        </div>
        <p style="margin-top:16px;font-size:14px;opacity:0.7">Subfolder matches desktop Finder (empty folder).</p>
      </div>
    `;
    host.querySelector('[data-action="back"]')?.addEventListener("click", renderHome);
    host.querySelector('[data-action="empty"]')?.addEventListener("click", () => {
      /* decorative empty folder */
    });
  };

  renderHome();
}
