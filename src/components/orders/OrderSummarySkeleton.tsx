import { Skeleton } from "@/components/ui/skeleton";

export function OrderSummarySkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-[22px] rounded-photo-lg border border-line p-[22px]"
    >
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-1.5" />
        ))}
      </div>
      <div className="flex flex-col gap-2.5 border-t border-line pt-[18px]">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
}
