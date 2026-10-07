"use client";

import Image from "next/image";

import { ButtonCheckout } from "@/components/cart/ButtonCheckout";
import { BottomSheet, BottomSheetClose } from "@/components/ui/bottom-sheet";
import { useCartDetails } from "@/hooks/cart";
import { formatPriceFromEuros } from "@/utils/formatters";

export type AddedItem = {
  name: string;
  color: string;
  size: string;
  price: number;
  image: string;
};

/** Phone confirmation after Add to bag, with the bag total and checkout. */
export function AddedSheet({
  item,
  onClose,
}: {
  item: AddedItem | null;
  onClose: () => void;
}) {
  const { items } = useCartDetails();
  const pieces = items.reduce((total, line) => total + line.quantity, 0);
  const subtotal = items.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );

  return (
    <BottomSheet
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Added"
    >
      {item ? (
        <div className="stagger-in grid grid-cols-[64px_1fr_auto] items-center gap-3">
          <Image
            src={item.image}
            alt=""
            width={64}
            height={82}
            sizes="64px"
            className="h-[82px] w-16 rounded-[14px] bg-photo object-cover"
          />
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-13">
              {item.color} · {item.size}
            </span>
          </span>
          <span className="tabular-nums">{formatPriceFromEuros(item.price)}</span>
        </div>
      ) : null}
      {pieces > 0 ? (
        <div className="flex justify-between text-sm tabular-nums">
          <span>
            Bag · {pieces} {pieces === 1 ? "piece" : "pieces"}
          </span>
          <span>{formatPriceFromEuros(subtotal)}</span>
        </div>
      ) : null}
      <div className="flex gap-2">
        <BottomSheetClose className="press h-14 grow rounded-pill border border-fg font-medium">
          Keep shopping
        </BottomSheetClose>
        <ButtonCheckout
          cartItemIds={items.map((line) => line.id)}
          className="h-14 grow"
        />
      </div>
    </BottomSheet>
  );
}
