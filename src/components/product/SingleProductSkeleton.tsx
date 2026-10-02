import { Skeleton } from "@/components/ui/skeleton";

export const SingleProductSkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Loading product"
    className="-mx-4 grid lg:mx-0 lg:grid-cols-[minmax(0,7fr)_minmax(400px,5fr)] lg:gap-12 lg:pb-24 lg:pt-8"
  >
    <div className="grid lg:grid-cols-2 lg:gap-3">
      <Skeleton className="h-[430px] rounded-none rounded-b-section lg:col-span-2 lg:aspect-[4/5] lg:h-auto lg:rounded-photo-lg" />
      <Skeleton className="hidden aspect-[3/4] rounded-photo-lg lg:block" />
      <Skeleton className="hidden aspect-[3/4] rounded-photo-lg lg:block" />
    </div>
    <div className="flex flex-col gap-5 px-4 pt-[18px] lg:gap-7 lg:px-0 lg:pt-0">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-[min(180px,14vw)] min-h-20 w-full rounded-field" />
      <Skeleton className="h-6 w-24" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[72px] rounded-chip" />
        <Skeleton className="h-[72px] rounded-chip" />
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[52px]" />
        ))}
      </div>
      <Skeleton className="h-16" />
    </div>
  </div>
);
