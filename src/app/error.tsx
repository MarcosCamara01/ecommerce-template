"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-classes";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="flex min-h-[70vh] flex-col items-start justify-center gap-5 py-10">
      <span
        aria-hidden="true"
        className="font-display text-[150px] leading-[0.78] lg:text-[min(480px,33vw)]"
      >
        Oops
      </span>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] lg:text-[40px]">
        Something went wrong
      </h1>
      <p className="max-w-[520px] text-[17px]">
        There was an issue with our storefront. This could be a temporary issue,
        please try your action again.
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
  );
}
