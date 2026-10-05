import Link from "@/components/ui/link";

import { buttonClass } from "@/components/ui/button-classes";

export type ResultIcon = "spin" | "cross" | "clock" | "alert";

const glyphs: Record<Exclude<ResultIcon, "spin">, React.ReactNode> = {
  cross: <path d="M7 7l10 10M17 7 7 17" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 7v6" />
      <path d="M12 16.5v.5" />
    </>
  ),
};

/** A checkout outcome that is not a success: icon, title, message, actions. */
export function ResultMessage({
  icon,
  title,
  message,
  checking = false,
  primary,
  secondary,
  footnote,
}: {
  icon: ResultIcon;
  title: string;
  message: string;
  /** Shows "Checking again automatically…" under the message. */
  checking?: boolean;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  footnote?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-180px)] max-w-[760px] flex-col justify-center gap-[22px] py-8 lg:min-h-[640px]">
      <span className="grid size-16 place-items-center rounded-pill border-2 border-fg">
        {icon === "spin" ? (
          <span className="size-7 animate-spin rounded-pill border-[3px] border-line border-t-fg [animation-duration:1s] motion-reduce:animate-none" />
        ) : (
          <svg
            aria-hidden="true"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {glyphs[icon]}
          </svg>
        )}
      </span>
      <h2 className="font-display text-[64px] leading-[0.85] lg:text-[min(160px,11vw)]">
        {title}
      </h2>
      <p className="max-w-[560px] text-lg">{message}</p>
      {checking ? (
        <span role="status" className="text-sm text-muted">
          Checking again automatically…
        </span>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link href={primary.href} className={buttonClass()}>
          {primary.label}
        </Link>
        {secondary ? (
          <Link href={secondary.href} className={buttonClass({ variant: "secondary" })}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
      {footnote}
    </div>
  );
}
