import { Skeleton } from "@/components/ui/skeleton";

export function OrderSummarySkeleton() {
  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Order Status</h3>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>
              <Skeleton className="h-4 w-24" />
            </span>
            <span>
              <Skeleton className="h-4 w-16" />
            </span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-background-tertiary">
            <Skeleton className="h-full w-3/4" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>
              <Skeleton className="h-4 w-32" />
            </span>
            <span>
              <Skeleton className="h-4 w-16" />
            </span>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Skeleton className="h-4 w-24" />
            </span>
            <span>
              <Skeleton className="h-4 w-20" />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Skeleton className="h-4 w-20" />
            </span>
            <span>
              <Skeleton className="h-4 w-28" />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Skeleton className="h-4 w-32" />
            </span>
            <span>
              <Skeleton className="h-4 w-28" />
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </h3>
        <div className="space-y-2 text-sm">
          <div className="font-medium">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="pt-3 mt-3 space-y-2 border-t border-border-primary">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-36" />
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Skeleton className="h-4 w-16" />
            </span>
            <span>
              <Skeleton className="h-4 w-16" />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </span>
            <span>
              <Skeleton className="h-4 w-12" />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Skeleton className="h-4 w-20" />
            </span>
            <span>
              <Skeleton className="h-4 w-12" />
            </span>
          </div>

          <div className="pt-3 border-t border-border-primary">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">
                <Skeleton className="h-6 w-12" />
              </span>
              <span className="text-xl font-bold">
                <Skeleton className="h-7 w-20" />
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
