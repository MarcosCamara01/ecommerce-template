import Link from "next/link";
import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
  children: ReactNode;
}

export const AuthShell = ({
  title,
  description,
  footerText,
  footerHref,
  footerLinkLabel,
  children,
}: AuthShellProps) => {
  return (
    <section className="w-full py-8 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[30rem]">
        <div className="rounded-xl border border-border-primary bg-background-secondary p-5 shadow-[0_16px_40px_rgba(0,0,0,0.26)] sm:p-6">
          <div className="space-y-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="text-[13px] leading-5 text-color-secondary">
              {description}
            </p>
          </div>

          <div className="mt-6">{children}</div>

          <p className="mt-6 text-[13px] leading-5 text-color-secondary">
            {footerText}{" "}
            <Link
              href={footerHref}
              className="font-medium text-white transition-colors hover:text-color-secondary"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
