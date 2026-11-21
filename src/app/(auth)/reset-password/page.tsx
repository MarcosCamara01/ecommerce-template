import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { pickFirst } from "@/utils/pick-first";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function ResetPassword({ searchParams }: Props) {
  return (
    <Suspense>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({ searchParams }: Props) {
  const token = pickFirst(await searchParams, "token") ?? "";
  return <ResetPasswordForm token={token} />;
}
