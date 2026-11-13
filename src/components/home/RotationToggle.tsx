import { PauseIcon, PlayIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { HERO_DWELL_MS } from "./useHeroRotation";

// The right and bottom borders, turned back 45deg, cover the right half of
// the circle, from 12 to 6 o'clock.
const halfRing =
  "absolute inset-y-0 w-[200%] rounded-pill border-[1.25px] border-transparent border-b-current border-r-current [rotate:-45deg] lg:border-[1.5px]";

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
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-pill border-[1.25px] border-line lg:border-[1.5px]"
      />
      {playing ? (
        <span key={cycle} aria-hidden="true" className="absolute inset-0">
          <span className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <span
              className={cn(halfRing, "right-0 animate-dwell-right")}
              style={{ animationDuration: `${HERO_DWELL_MS}ms` }}
            />
          </span>
          <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <span
              className={cn(halfRing, "left-0 animate-dwell-left")}
              style={{ animationDuration: `${HERO_DWELL_MS}ms` }}
            />
          </span>
        </span>
      ) : null}
      {stopped ? <PlayIcon /> : <PauseIcon />}
    </button>
  );
}
