import { cn } from "@/lib/utils";

export const GridProducts = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid gap-x-3.5 gap-y-6 sm:gap-y-9 sm:grid-cols-auto-fill-250",
        className
      )}
    >
      {children}
    </div>
  );
};
