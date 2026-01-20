import { Skeleton } from "@/components/ui/skeleton";

export const SingleProductSkeleton = () => (
  <>
    <div className="flex flex-col lg:flex-row lg:gap-6 xl:gap-8">
      <div className="w-full lg:w-[60%] xl:w-[65%] 2xl:w-[70%]">
        {/* Mobile */}
        <div className="lg:hidden">
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
        </div>
        {/* Desktop */}
        <div className="hidden lg:grid grid-cols-2 gap-1 rounded overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="w-full aspect-[2/3]" />
          ))}
        </div>
      </div>

      {/* Desktop only */}
      <div className="hidden lg:block lg:w-[40%] xl:w-[35%] 2xl:w-[30%]">
        <div className="sticky top-20 flex flex-col gap-5">
          <div className="w-full border border-solid overflow-hidden rounded border-border-primary bg-background-secondary">
            <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary">
              <Skeleton className="w-3/4 h-6" />
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="w-full h-5" />
            </div>
            <ButtonsSkeleton />
          </div>
        </div>
      </div>
    </div>

    {/* Mobile fixed bottom bar */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-primary border-t border-border-primary safe-area-bottom">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
        <MobileButtonsSkeleton />
      </div>
    </div>
  </>
);

export const ButtonsSkeleton = () => (
  <>
    <div className="p-5">
      <div className="grid grid-cols-4 gap-2.5 justify-center">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="w-full h-[33px]" />
        ))}
      </div>
      <div className="grid grid-cols-auto-fill-32 gap-2.5 mt-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="w-8 h-8 rounded" />
        ))}
      </div>
    </div>

    <div className="border-t border-solid border-border-primary">
      <div className="w-full p-2">
        <Skeleton className="h-5 w-[100px] mx-auto" />
      </div>
    </div>
  </>
);

export const MobileButtonsSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div className="flex-1 grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="w-full h-6" />
        ))}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="w-6 h-6 rounded" />
        ))}
      </div>
    </div>
    <Skeleton className="w-full h-10 rounded-md" />
  </div>
);
