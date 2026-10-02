import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-pill bg-skel motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
