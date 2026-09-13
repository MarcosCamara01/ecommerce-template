"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FiArchive } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoadingButton from "@/components/ui/loadingButton";
import { CART_QUERY_KEYS } from "@/hooks/cart/keys";
import { archiveProduct } from "@/hooks/product/mutations/productMutations";
import { WISHLIST_QUERY_KEYS } from "@/hooks/wishlist/keys";
import { useSession } from "@/lib/auth/client";

export function ArchiveProductButton({ productId }: { productId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const archive = useMutation({
    mutationFn: async () => {
      const result = await archiveProduct(productId);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      // Archiving drops the product from carts and wishlists server-side, and
      // both caches embed the full product row. router.refresh() only reaches
      // the server components, so the query cache has to be invalidated too.
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: CART_QUERY_KEYS.cartList(userId),
        });
        void queryClient.invalidateQueries({
          queryKey: WISHLIST_QUERY_KEYS.wishlistList(userId),
        });
      }
      toast.success(
        result.accepted
          ? "Product archive recorded and synchronizing"
          : "Product archived successfully",
      );
      router.replace(`/admin/products/${productId}/edit?restore=1`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error archiving product");
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 pb-10 md:px-8">
      <div className="flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-red-200">Archive Product</h2>
          <p className="mt-1 text-sm text-color-secondary">
            Hide this product from the storefront while preserving orders and its durable identity.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive">
              <FiArchive className="mr-2 h-4 w-4" aria-hidden="true" />
              Archive Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive This Product?</DialogTitle>
              <DialogDescription>
                It will disappear from search, collections, carts, and wishlists. Historical orders remain available, and an administrator can restore it later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={archive.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton
                type="button"
                loading={archive.isPending}
                onClick={() => archive.mutate()}
                className="bg-red-600 text-white hover:bg-red-500"
              >
                Confirm Archive
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
