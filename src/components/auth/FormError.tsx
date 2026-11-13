"use client";

import { useState } from "react";
import { MdError } from "react-icons/md";

/**
 * A form's error row. It opens and closes in place (`.reveal-row`) instead of
 * jumping the form, keeps its last message while it closes, and is an alert
 * only while open, so each failure is announced once.
 *
 * A retry clears the error while its request runs. `pending` holds the row
 * open meanwhile, so the form does not close and reopen under the button
 * that was just pressed; `attempt` remounts the alert for each answer.
 */
export function FormError({
  message,
  pending = false,
  attempt = 0,
}: {
  message: string | null;
  pending?: boolean;
  attempt?: number;
}) {
  const [shown, setShown] = useState(message);
  if (message && message !== shown) setShown(message);
  const open = Boolean(message) || (pending && Boolean(shown));

  return (
    <div
      className="reveal-row"
      data-open={open}
      aria-hidden={!open || undefined}
    >
      <div>
        {shown ? (
          <div
            // A new failure mounts a new alert, so a repeated message is announced again.
            key={message ? `open-${attempt}` : "closing"}
            role={message ? "alert" : undefined}
            className="flex items-start gap-2.5 rounded-field bg-err-bg px-3.5 py-3 text-sm text-err-fg"
          >
            <MdError className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
            <p>{shown}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
