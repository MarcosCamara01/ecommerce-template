import Link from "next/link";
import { ReactNode } from "react";

interface AuthShellProps {
  /** The giant word: shown above the form on phones (the art panel has it on desktop). */
  word: string;
  title: string;
  description: string;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
  children: ReactNode;
}

/**
 * The form column of the sign-in and sign-up pages. The wordmark and the
 * theme toggle live in the global navigation above it.
 */
export const AuthShell = ({
  word,
  title,
  description,
  footerText,
  footerHref,
  footerLinkLabel,
  children,
}: AuthShellProps) => {
  return (
    <section className="mx-auto flex w-full max-w-[460px] flex-col justify-center">
      <span aria-hidden="true" className="mb-6 font-display text-[88px] leading-[0.8] lg:hidden">
        {word}
      </span>
      <h1 className="text-[30px] font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mb-6 mt-1.5 text-muted">{description}</p>

      {children}

      <p className="mt-6 text-sm">
        {footerText}{" "}
        <Link
          href={footerHref}
          className="font-semibold underline underline-offset-[3px]"
        >
          {footerLinkLabel}
        </Link>
      </p>
    </section>
  );
};
