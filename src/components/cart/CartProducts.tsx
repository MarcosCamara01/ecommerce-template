"use client";

/** FUNCTIONALITY */
import { useCart } from "@/hooks/cart";
/** COMPONENTS */
import Link from "next/link";
import ButtonCheckout from "./ButtonCheckout";
import { GridProducts } from "../products/GridProducts";
import { CartProduct } from "./product";
/** TYPES */
import type { ProductWithVariants } from "@/schemas";

export const CartProducts = ({
  allProducts,
}: {
  allProducts: ProductWithVariants[];
}) => {
  const { items } = useCart();

  if (items && items.length > 0) {
    const cartProductsWithInfo = items
      .map((cartItem) => {
        const product = allProducts.find((p) =>
          p.variants.some((variant) => variant.id === cartItem.variantId)
        );
        if (!product) return null;

        const variant = product.variants.find(
          (v) => v.id === cartItem.variantId
        );
        if (!variant) return null;

        return {
          cartItem,
          product,
          variant,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalPrice = cartProductsWithInfo
      .reduce(
        (sum, { product, cartItem }) => sum + product.price * cartItem.quantity,
        0
      )
      .toFixed(2);

    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">
          YOUR SHOPPING CART
        </h2>
        <GridProducts className="grid-cols-1">
          {cartProductsWithInfo.map(({ product, cartItem, variant }) => (
            <CartProduct
              key={cartItem.id}
              product={product}
              cartItemId={cartItem.id}
              size={cartItem.size}
              quantity={cartItem.quantity}
              variant={variant}
            />
          ))}
        </GridProducts>

        <div className="fixed left-[50%] translate-x-[-50%] bottom-4 w-[90%] z-10 sm:w-[360px] rounded-xl overflow-hidden flex bg-background-primary border border-solid border-border-primary h-min">
          <div className="flex flex-col p-2.5 justify-center w-1/2 gap-2 text-center">
            <div className="flex gap-2.5 justify-center text-sm">
              <span>Total:</span>
              <span>{totalPrice}€</span>
            </div>
            <span className="text-xs">+ TAX INCL.</span>
          </div>
          <div className="w-1/2 border-l border-solid bg-background-secondary border-border-primary">
            <ButtonCheckout cartItems={items} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR CART IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to your cart, it will appear here. Want to
        get started?
      </p>
      <Link
        className="flex font-medium items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-background-tertiary hover:border-[#454545]"
        href="/"
      >
        Start
      </Link>
    </div>
  );
};
