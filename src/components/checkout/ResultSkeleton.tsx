import { Skeleton } from "@/components/ui/skeleton";

export function ResultSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Checking your payment"
      className="flex flex-col gap-6 pt-6 lg:gap-10"
    >
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-[min(240px,20vw)] min-h-20 w-3/4 rounded-photo" />
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="aspect-[3/4] rounded-photo lg:aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}
