import Link from "next/link";

import { buttonClass } from "@/components/ui/button-classes";
import { getPrincipal, hasCapability } from "@/lib/identity";

export async function EditProductButton({ productId }: { productId: number }) {
  if (!hasCapability(await getPrincipal(), "catalog:manage")) return null;
  return (
    <Link
      href={`/admin/products/${productId}/edit`}
      className={buttonClass({ variant: "outline", size: "xs" })}
    >
      Edit product
    </Link>
  );
}
