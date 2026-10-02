import { Skeleton } from "@/components/ui/skeleton";

/** Grid placeholder from CStates: photo tile and two text bars per card. */
export const ProductsSkeleton = ({ items }: { items: number }) => (
  <div
    aria-busy="true"
    aria-label="Loading products"
    className="grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:grid-cols-4 lg:gap-x-4 lg:gap-y-7"
  >
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="flex flex-col gap-2.5">
        <Skeleton
          className="aspect-[3/4] rounded-[18px] lg:rounded-photo"
          style={{ animationDelay: `${(index % 4) * 150}ms` }}
        />
        <Skeleton className="h-3.5 w-[70%]" style={{ animationDelay: `${(index % 4) * 150}ms` }} />
        <Skeleton className="h-3.5 w-[30%]" style={{ animationDelay: `${(index % 4) * 150}ms` }} />
      </div>
    ))}
  </div>
);
