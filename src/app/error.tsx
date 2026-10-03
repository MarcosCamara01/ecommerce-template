"use client";

import Link from "next/link";

import { ErrorHeader } from "@/components/layout/ErrorHeader";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-classes";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div data-error-page="" className="pb-12 lg:pb-24">
      <ErrorHeader />
      <section className="flex flex-col items-start gap-[18px] pt-2">
      <span
        aria-hidden="true"
        className="font-display text-[150px] leading-[0.78] lg:text-[min(480px,33vw)]"
      >
        Oops
      </span>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] lg:text-[40px]">
        Something went wrong
      </h1>
      <p className="max-w-[520px] text-[17px] opacity-90">
        An unexpected error stopped this page from loading. Try again in a
        moment.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/" className={buttonClass({ variant: "secondary" })}>
          Back to home
        </Link>
      </div>
      </section>
    </div>
  );
}
