import { PauseIcon, PlayIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { HERO_DWELL_MS } from "./useHeroRotation";

/**
 * While the rotation runs, the ring fills over the time each piece stays
 * up, so the next change never comes as a surprise.
 *
 * It fills by `transform` alone, so it runs on the compositor: two
 * half-rings, each clipped to one side, turn into view one after the other.
 */
export function RotationToggle({
  playing,
  stopped,
  cycle,
  onToggle,
  className,
}: {
  playing: boolean;
  stopped: boolean;
  /** Changes whenever the ring starts again: each piece, each skipped tick. */
  cycle: number;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-hero-free=""
      onClick={onToggle}
      aria-label={stopped ? "Resume automatic rotation" : "Pause automatic rotation"}
      className={cn(
        "press relative grid shrink-0 place-items-center rounded-pill",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 52 52"
        fill="none"
        strokeWidth="1.5"
        className="absolute inset-0 size-full"
      >
        <circle cx="26" cy="26" r="25.25" className="stroke-line" />
      </svg>
      {playing ? (
        <span key={cycle} aria-hidden="true" className="absolute inset-0">
          <span className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <HalfRing className="right-0 animate-dwell-right" />
          </span>
          <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <HalfRing className="left-0 animate-dwell-left" />
          </span>
        </span>
      ) : null}
      {stopped ? <PlayIcon /> : <PauseIcon />}
    </button>
  );
}

/**
 * The right half of the ring, 12 to 6 o'clock, the size of the whole
 * toggle. An SVG stroke rather than a border: Chrome rounds border widths
 * down to whole pixels, which thins the 1.5px ring to 1px.
 */
function HalfRing({ className }: { className: string }) {
  return (
    <span
      className={cn("absolute inset-y-0 w-[200%]", className)}
      style={{ animationDuration: `${HERO_DWELL_MS}ms` }}
    >
      <svg
        viewBox="0 0 52 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-full"
      >
        <path d="M26 .75a25.25 25.25 0 0 1 0 50.5" />
      </svg>
    </span>
  );
}
