import Link from "next/link";
import { FiEdit2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/server";

interface EditProductButtonProps {
  productId: number;
}

export async function EditProductButton({ productId }: EditProductButtonProps) {
  const session = await getSession();
  const adminEmail = process.env.ADMIN_EMAIL;

  // Only show button if user is authenticated and is admin
  if (!session?.user || !adminEmail || session.user.email !== adminEmail) {
    return null;
  }

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
