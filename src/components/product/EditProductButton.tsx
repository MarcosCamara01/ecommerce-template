import Link from "next/link";
import { FiEdit2 } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { getPrincipal, hasCapability } from "@/lib/identity";

export async function EditProductButton({ productId }: { productId: number }) {
  if (!hasCapability(await getPrincipal(), "catalog:manage")) return null;
  return (
    <Link href={`/admin/products/${productId}/edit`}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
      >
        <FiEdit2 className="h-4 w-4" />
        Edit Product
      </Button>
    </Link>
  );
}
