import { cn } from "@/lib/utils";

/** Two columns on phones; fluid columns on desktop unless a count is set. */
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
        "grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] lg:gap-x-4 lg:gap-y-7",
        className,
      )}
    >
      {children}
    </div>
  );
};
