import { PauseIcon, PlayIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { HERO_DWELL_MS } from "./useHeroRotation";

/**
 * Pauses and resumes the hero rotation. While it runs, the ring fills over
 * the time each piece stays up, so the next change never comes as a surprise.
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
  /** Changes with every piece so the ring starts again. */
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
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle cx="26" cy="26" r="25.25" className="stroke-line" />
        {playing ? (
          <circle
            key={cycle}
            cx="26"
            cy="26"
            r="25.25"
            pathLength={100}
            strokeDasharray="100"
            stroke="currentColor"
            className="animate-dwell"
            style={{ animationDuration: `${HERO_DWELL_MS}ms` }}
          />
        ) : null}
      </svg>
      {stopped ? <PlayIcon /> : <PauseIcon />}
    </button>
  );
}
