import { Skeleton } from "@/components/ui/skeleton";

export function ResultSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SkeletonCard>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4 pl-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="w-4 h-4 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 border border-solid rounded-lg bg-background-secondary border-border-primary">
      {children}
    </div>
  );
}
