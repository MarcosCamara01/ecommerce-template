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
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-32" />
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
