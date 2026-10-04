"use client";

import { displayName } from "@/utils/product-name";
import Image from "next/image";
import Link from "next/link";

import { CloseIcon } from "@/components/icons";
import { ButtonCheckout } from "@/components/cart/ButtonCheckout";
import { buttonClass } from "@/components/ui/button-classes";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartDetails } from "@/hooks/cart";
import { useFocusReturn } from "@/hooks/useFocusReturn";
import { formatPriceFromEuros } from "@/utils/formatters";

import { setBagOpen, useBagUi } from "./bag-ui";

/**
 * Desktop bag drawer: slides in from the right edge (420ms drawer curve over
 * a 200ms scrim), items arrive 50ms apart, and it leaves the way it came.
 */
export function BagDrawer() {
  const { open, added } = useBagUi();
  const focusReturn = useFocusReturn();
  const { items, isLoading } = useCartDetails();
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  return (
    <Sheet open={open} onOpenChange={setBagOpen}>
      <SheetContent
        side="right"
        {...focusReturn}
        className="w-[min(460px,100vw)] gap-5 bg-bg p-7 shadow-[-30px_0_80px_rgba(0,0,0,.25)]"
      >
        <div className="flex items-center justify-between">
          <SheetTitle className="text-[64px]">
            Bag {isLoading ? "" : `(${count})`}
          </SheetTitle>
          <SheetClose
            aria-label="Close bag"
            className="press grid size-12 place-items-center rounded-pill border border-line"
          >
            <CloseIcon size={16} />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">
          Items in your bag and checkout.
        </SheetDescription>

        {added ? (
          <span className="self-start rounded-pill bg-fg px-3 py-1.5 text-13 font-medium text-bg">
            Added · {added.color}, {added.size}
          </span>
        ) : null}

        {isLoading ? (
          <div className="flex grow flex-col gap-3.5" aria-busy="true">
            {[0, 1].map((key) => (
              <div key={key} className="grid grid-cols-[84px_1fr] items-center gap-3.5">
                <Skeleton className="h-[108px] rounded-field" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex grow flex-col items-start justify-center gap-4">
            <p className="font-display text-5xl leading-[0.9]">Your bag is empty</p>
            <p className="text-muted">
              Anything you add shows up here, ready for checkout.
            </p>
            <SheetClose asChild>
              <Link href="/new-in" className={buttonClass({ size: "sm" })}>
                See what&apos;s new
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            <ul className="-mx-1 flex grow flex-col gap-3.5 overflow-y-auto px-1">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="stagger-in grid grid-cols-[84px_1fr_auto] items-center gap-3.5 border-b border-line pb-3.5"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <Image
                    src={item.variant.images[0]}
                    alt=""
                    width={84}
                    height={108}
                    sizes="84px"
                    className="h-[108px] w-[84px] rounded-field bg-photo object-cover"
                  />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{displayName(item.product.name)}</span>
                    <span className="text-13 text-muted">
                      {item.variant.color} · {item.size} · Qty {item.quantity}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatPriceFromEuros(item.product.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between">
              <span>Subtotal</span>
              <span className="text-[28px] font-semibold tabular-nums">
                {formatPriceFromEuros(subtotal)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <ButtonCheckout
                cartItemIds={items.map((item) => item.id)}
                className="h-[60px] w-full text-base"
              />
              <SheetClose asChild>
                <Link
                  href="/cart"
                  className="self-center py-2 text-sm underline underline-offset-[3px]"
                >
                  View bag
                </Link>
              </SheetClose>
            </div>
            <p className="text-center text-xs text-muted">
              Secure payment with Stripe. Shipping calculated at checkout.
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
