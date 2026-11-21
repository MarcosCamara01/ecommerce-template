import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { buttonClass } from "@/components/ui/button-classes";
import Link from "@/components/ui/link";
import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { authPageHref } from "@/lib/auth/email-flows";
import { authErrorCode, authErrorMessage } from "@/lib/auth/form-errors";
import { safeLocalCallback } from "@/lib/auth/local-callback";
import { pickFirst } from "@/utils/pick-first";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function EmailVerificationPage({ searchParams }: Props) {
  return (
    <Suspense>
      <VerificationOutcome searchParams={searchParams} />
    </Suspense>
  );
}

async function VerificationOutcome({ searchParams }: Props) {
  const params = await searchParams;
  const destination = safeLocalCallback(pickFirst(params, "redirect"), getCanonicalAppOrigin());
  const signInHref = authPageHref("signIn", { redirect: destination });
  const error = pickFirst(params, "error");

  if (error) {
    const code = authErrorCode(error);
    return (
      <AuthShell
        word="Oops"
        title={code === "TOKEN_EXPIRED" ? "This link has expired" : "This link doesn’t work"}
        description={`${authErrorMessage(code)} Sign in with your email and password, and we’ll send you a new link.`}
        footerText="No account yet?"
        footerHref={authPageHref("register", { redirect: destination })}
        footerLinkLabel="Create one here"
      >
        <Link href={signInHref} className={buttonClass({ className: "w-full text-base" })}>
          Sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      word="Welcome"
      title="Email verified"
      description="Your account is ready. Sign in to continue."
      footerText="Just browsing?"
      footerHref="/"
      footerLinkLabel="Back to the store"
    >
      <Link href={signInHref} className={buttonClass({ className: "w-full text-base" })}>
        Sign in
      </Link>
    </AuthShell>
  );
}
