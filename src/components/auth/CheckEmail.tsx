import { ReactNode } from "react";

export function CheckEmail({
  email,
  ifAccountExists = false,
  children,
}: {
  email: string;
  ifAccountExists?: boolean;
  children: ReactNode;
}) {
  const address = <strong className="break-all font-semibold">{email}</strong>;
  return (
    <div role="status" className="flex flex-col gap-2 rounded-field bg-card px-4 py-4 text-sm">
      <p>
        {ifAccountExists ? (
          <>If an account uses {address}, we sent it a link.</>
        ) : (
          <>We sent a link to {address}.</>
        )}
      </p>
      <p className="text-muted">{children}</p>
    </div>
  );
}
