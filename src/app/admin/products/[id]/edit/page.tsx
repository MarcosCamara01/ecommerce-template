import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditProductForm } from "@/components/admin";
import { requireCapability } from "@/lib/identity";
import {
  getArchivedProductForRestoration,
  getProductByIdForManager,
} from "@/services/products.service";
import { Skeleton } from "@/components/ui/skeleton";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ restore?: string }>;
}

async function DynamicEditProductContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ restore?: string }>;
}) {
  const { id } = await params;
  const { restore } = await searchParams;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const principal = await requireCapability("catalog:manage");
  const product = restore === "1"
    ? await getArchivedProductForRestoration(principal, productId)
    : await getProductByIdForManager(principal, productId);

  if (!product) {
    notFound();
  }

  return (
    <EditProductForm product={product} restoreArchived={restore === "1"} />
  );
}

function EditProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="flex flex-col gap-6 pt-10">
      <Skeleton className="h-[min(160px,11vw)] min-h-16 w-1/2 rounded-photo" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-72 rounded-photo-lg" />
          <Skeleton className="h-48 rounded-photo-lg" />
        </div>
        <Skeleton className="h-[480px] rounded-photo-lg" />
      </div>
    </div>
  );
}

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  return (
    <Suspense fallback={<EditProductSkeleton />}>
      <DynamicEditProductContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
