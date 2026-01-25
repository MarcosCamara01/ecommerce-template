import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditProductForm } from "@/components/admin";
import { getProductById } from "@/services/products.service";
import { Skeleton } from "@/components/ui/skeleton";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function DynamicEditProductContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return <EditProductForm product={product} />;
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
}: EditProductPageProps) {
  return (
    <Suspense fallback={<EditProductSkeleton />}>
      <DynamicEditProductContent params={params} />
    </Suspense>
  );
}
