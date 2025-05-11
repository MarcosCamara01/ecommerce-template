/** ACTIONS */
import { addCartItem } from "@/app/(carts)/cart/action";
/** FUNCTIONALITY */
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
/** COMPONENTS */
import LoadingButton from "@/components/ui/loadingButton";
import { Sizes, type SizesRef } from "./Sizes";
import { Colors } from "./Colors";
/** TYPES */
import type { ProductVariant, EnrichedProduct } from "@/schemas/ecommerce";

interface AddToCartProps {
  product: EnrichedProduct;
  selectedVariant: ProductVariant | undefined;
  onVariantChange: (variant: ProductVariant) => void;
}

export default function AddToCart({
  product,
  selectedVariant,
  onVariantChange,
}: AddToCartProps) {
  const sizesRef = useRef<SizesRef>(null!);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not found");
      if (!selectedVariant?.id) throw new Error("No variant selected");

      return await addCartItem({
        size: sizesRef.current.selectedSize,
        variant_id: selectedVariant.id,
      });
    },
    onError: (error) => {
      console.error("Error creating item:", error);
      toast.error("Error adding item to cart");
    },
    onSuccess: (newItem) => {
      console.log("Item added to cart:", newItem);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  if (!selectedVariant) return null;

  return (
    <>
      <div className="p-5">
        <Sizes ref={sizesRef} sizes={selectedVariant.sizes} />
        <Colors
          variants={product.variants}
          selectedVariantId={selectedVariant.id}
          onVariantChange={onVariantChange}
        />
      </div>

      <div className="border-t border-solid border-border-primary">
        <LoadingButton
          type="submit"
          loading={isPending}
          onClick={() => mutate()}
          className="w-full p-2 transition duration-150 text-13 ease hover:bg-color-secondary"
        >
          Add To Cart
        </LoadingButton>
      </div>
    </>
  );
}
