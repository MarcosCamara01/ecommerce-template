import { orderSteps } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

/**
 * Four-step progress bar. `step` is how many steps are done (0 for a
 * cancelled order); `notes` optionally adds a line under each label.
 */
export function OrderSteps({
  step,
  notes,
  labelled = true,
  className,
}: {
  step: number;
  notes?: readonly string[];
  labelled?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("grid grid-cols-4 gap-1.5", className)}>
      {orderSteps.map((label, index) => {
        const done = index < step;
        const current = index === step - 1;
        return (
          <li key={label} className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className={cn("h-1.5 rounded-pill", done ? "bg-fg" : "bg-fg/15")}
            />
            <span
              className={cn(
                "text-xs lg:text-13",
                labelled ? "" : "sr-only",
                current ? "font-bold" : done ? "font-medium" : "font-medium text-muted",
              )}
            >
              {label}
              {current ? <span className="sr-only"> (current)</span> : null}
            </span>
            {labelled && notes?.[index] ? (
              <span className="text-xs text-muted">{notes[index]}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
