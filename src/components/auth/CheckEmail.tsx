import { ReactNode } from "react";

/** The "we sent you a link" panel that replaces a form once its mail is on the way. */
export function CheckEmail({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-field bg-card px-4 py-4 text-sm">
      <p>
        We sent a link to <strong className="break-all font-semibold">{email}</strong>.
      </p>
      <p className="text-muted">{children}</p>
    </div>
  );
}
