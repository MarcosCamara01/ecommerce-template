import { Suspense } from "react";
import { CreateProductForm } from "@/components/admin";
import { requireCapability } from "@/lib/identity";

async function AuthorizedCreateProductForm() {
  await requireCapability("catalog:manage");
  return <CreateProductForm />;
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={null}>
      <AuthorizedCreateProductForm />
    </Suspense>
  );
}
