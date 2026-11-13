import { Skeleton } from "@/components/ui/skeleton";

export const ProductsSkeleton = ({ items }: { items: number }) => (
  <div
    aria-busy="true"
    aria-label="Loading products"
    className="grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:grid-cols-4 lg:gap-x-4 lg:gap-y-7"
  >
    {Array.from({ length: items }, (_, index) => {
      // A negative delay starts each column mid-shimmer: a positive one
      // left the tile at full opacity until it began, then it snapped.
      // Counting down from the last column keeps the wave left to right.
      const phase = { animationDelay: `${-(3 - (index % 4)) * 150}ms` };
      return (
        <div key={index} className="flex flex-col gap-2.5">
          <Skeleton className="aspect-[3/4] rounded-[18px] lg:rounded-photo" style={phase} />
          <Skeleton className="h-3.5 w-[70%]" style={phase} />
          <Skeleton className="h-3.5 w-[30%]" style={phase} />
        </div>
      );
    })}
  </div>
);
