import { prefersReducedMotion } from "@/lib/motion";

const FLIGHT_MS = 600;
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

/**
 * Sends a copy of the product photo to the desktop "Bag · n" pill
 * (transform 600ms ease-in-out). Resolves when it lands, or at once when
 * there is no visible pill or motion is reduced.
 */
export function flyToBag(source: HTMLElement | null): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-bag-target]");
  // A card showing its second photo marks it: that is the one in view.
  const photo =
    source?.querySelector<HTMLImageElement>("img[data-fly]") ??
    source?.querySelector("img");
  if (!source || !photo || !target || prefersReducedMotion()) {
    return Promise.resolve();
  }
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (to.width === 0 || from.height === 0) return Promise.resolve();

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

  // Land as a 40px-tall thumbnail centred on the pill.
  const scale = 40 / from.height;
  const dx = to.left + to.width / 2 - (from.width * scale) / 2 - from.left;
  const dy = to.top + to.height / 2 - (from.height * scale) / 2 - from.top;
  const flight = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.85 },
    ],
    { duration: FLIGHT_MS, easing: EASE_IN_OUT },
  );
  return flight.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  );
}
