import { cssEase, EASE_IN_OUT, prefersReducedMotion } from "@/lib/motion";

const FLIGHT_MS = 600;

/**
 * Sends a copy of the product photo to the desktop "Bag · n" pill
 * (transform 600ms ease-in-out), where it dissolves into the pill. Resolves
 * `true` as the pill takes the photo, or `false` at once when there is no
 * visible pill or motion is reduced.
 */
export function flyToBag(source: HTMLElement | null): Promise<boolean> {
  const target = document.querySelector<HTMLElement>("[data-bag-target]");
  // A card showing its second photo marks it: that is the one in view.
  const photo =
    source?.querySelector<HTMLImageElement>("img[data-fly]") ??
    source?.querySelector("img");
  if (!source || !photo || !target || prefersReducedMotion()) {
    return Promise.resolve(false);
  }
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (to.width === 0 || from.height === 0) return Promise.resolve(false);

  const ghost = document.createElement("img");
  ghost.src = photo.currentSrc || photo.src;
  ghost.alt = "";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: "cover",
    borderRadius: "28px",
    background: "#E4E7EA",
    boxShadow: "0 30px 60px rgba(0,0,0,.25)",
    transformOrigin: "0 0",
    pointerEvents: "none",
    zIndex: "60",
  });
  document.body.append(ghost);

  // Land as a 24px-tall thumbnail centred on the pill.
  const scale = 24 / from.height;
  const dx = to.left + to.width / 2 - (from.width * scale) / 2 - from.left;
  const dy = to.top + to.height / 2 - (from.height * scale) / 2 - from.top;
  // The path eases; the fade keeps to the clock (opaque for 450ms), so the
  // photo is still there when it reaches the pill. An easing on the whole
  // effect would move the 75% mark to 54% of the time.
  const flight = ghost.animate(
    [
      {
        transform: "translate(0px, 0px) scale(1)",
        opacity: 1,
        easing: cssEase(EASE_IN_OUT),
      },
      { opacity: 1, offset: 0.75 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
    ],
    { duration: FLIGHT_MS },
  );
  // The pill takes the photo at 85%: the count rolls and bumps as it dissolves in.
  return new Promise((resolve) => {
    const land = window.setTimeout(() => resolve(true), FLIGHT_MS * 0.85);
    const done = () => {
      window.clearTimeout(land);
      ghost.remove();
      resolve(true);
    };
    flight.finished.then(done, done);
  });
}
