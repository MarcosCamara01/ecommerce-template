import { notFound } from "next/navigation";
import { EditProductForm } from "@/components/admin";
import { getProductById } from "@/services/products.service";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
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
