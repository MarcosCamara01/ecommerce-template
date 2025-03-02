"use client";

import { useState } from "react";
import { ProductDocument, VariantsDocument } from "@/types/types";
import { colorMapping } from "@/helpers/colorMapping";
import { addItem } from "@/app/(carts)/cart/action";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import LoadingButton from "../ui/loadingButton";
import { useMutation } from "@tanstack/react-query";

interface AddToCartProps {
  product: ProductDocument;
  selectedVariant: VariantsDocument | undefined;
  setSelectedVariant: (variant: VariantsDocument) => void;
}

export default function AddToCart({
  product,
  selectedVariant,
  setSelectedVariant,
}: AddToCartProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const { user } = useUser();

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: () => {
      if (!user) {
        throw new Error("You must be registered to be able to add a product to the cart.");
      }
      if (!selectedVariant?.priceId) {
        throw new Error("You have to select a color to save the product.");
      }
      if (!selectedSize) {
        throw new Error("You have to select a size to save the product.");
      }

      return addItem(
        product.category,
        product.id,
        selectedSize,
        selectedVariant.priceId,
        product.price
      );
    },
    onError: (error) => {
      toast.info(error.message);
    }
  });

  return (
    <>
      <div className="p-5">
        <div className="grid grid-cols-4 gap-2.5 justify-center">
          {product.sizes.map((size, index) => (
            <button
              key={index}
              className={`flex items-center justify-center border border-solid border-border-primary px-1 py-1.5 bg-black rounded transition duration-150 ease hover:border-border-secondary text-13 ${
                selectedSize === size ? "bg-white text-black" : ""
              }`}
              onClick={() => setSelectedSize(size)}
            >
              <span>{size}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-auto-fill-32 gap-2.5 mt-5">
          {product.variants.map((variant, index) => (
            <button
              key={index}
              className={`border border-solid border-border-primary w-8 h-8 flex justify-center relative rounded transition duration-150 ease hover:border-border-secondary ${
                selectedVariant?.color === variant.color
                  ? "border-border-secondary"
                  : ""
              }`}
              style={{ backgroundColor: colorMapping[variant.color] }}
              onClick={() => {
                setSelectedVariant(variant);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title={`Color ${variant.color}`}
            >
              <span
                className={
                  selectedVariant?.color === variant.color
                    ? "w-2.5 absolute bottom-selected h-px bg-white"
                    : ""
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-solid border-border-primary">
        <LoadingButton
          type="submit"
          loading={isPending}
          onClick={() => addToCart()}
          className="w-full p-2 transition duration-150 text-13 ease hover:bg-color-secondary"
        >
          Add To Cart
        </LoadingButton>
      </div>
    </>
  );
}
