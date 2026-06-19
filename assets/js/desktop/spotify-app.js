export function initSpotifyApp() {
  const overlay = document.getElementById("spotifyOverlay");
  if (!overlay) return;

  const windowEl = overlay.querySelector(".spotify-window");
  const closeDot = overlay.querySelector(".spotify-topnav .mac-close");
  const minDot = overlay.querySelector(".spotify-topnav .mac-min");

  function close(removeDockIndicator = true) {
    gsap.to(windowEl, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("is-visible");
        if (removeDockIndicator) {
          document
            .querySelector('.dock-icon[data-app="spotify"]')
            ?.classList.remove("is-open");
        }
      },
    });
  }

  closeDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  minDot?.addEventListener("click", (e) => {
    e.stopPropagation();
    close(false);
  });
}
