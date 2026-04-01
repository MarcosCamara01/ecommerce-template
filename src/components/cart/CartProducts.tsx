"use client";

import Link from "next/link";

import { useCartDetails } from "@/hooks/cart";
import { SVGLoadingIcon } from "@/components/ui/loader";

import { ButtonCheckout } from "./ButtonCheckout";
import { CartProduct } from "./CartProduct";
import { GridProducts } from "../products/GridProducts";

export const CartProducts = () => {
  const { items, isPending } = useCartDetails();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-91px)]">
        <SVGLoadingIcon height={30} width={30} />
      </div>
    );
  }

  if (items.length > 0) {
    const totalPrice = items
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      .toFixed(2);

    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">
          YOUR SHOPPING CART
        </h2>
        <GridProducts className="grid-cols-1">
          {items.map(({ id, product, size, quantity, variant }) => (
            <CartProduct
              key={id}
              product={product}
              cartItemId={id}
              size={size}
              quantity={quantity}
              variant={variant}
            />
          ))}
        </GridProducts>

        <div className="fixed bottom-4 left-[50%] z-10 flex h-min w-[90%] translate-x-[-50%] overflow-hidden rounded-xl border border-solid border-border-primary bg-background-primary sm:w-[360px]">
          <div className="flex w-1/2 flex-col justify-center gap-2 p-2.5 text-center">
            <div className="flex justify-center gap-2.5 text-sm">
              <span>Total:</span>
              <span>{totalPrice} EUR</span>
            </div>
            <span className="text-xs">+ TAX INCL.</span>
          </div>
          <div className="w-1/2 border-l border-solid border-border-primary bg-background-secondary">
            <ButtonCheckout cartItemIds={items.map((item) => item.id)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-91px)] w-full flex-col items-center justify-center gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR CART IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to your cart, it will appear here. Want to
        get started?
      </p>
      <Link
        className="flex h-[40px] min-w-[160px] max-w-[160px] items-center justify-center rounded-md border border-solid border-[#2E2E2E] bg-[#0C0C0C] px-[10px] text-sm font-medium transition-all hover:border-[#454545] hover:bg-background-tertiary"
        href="/"
      >
        Start
      </Link>
    </div>
  );
};
