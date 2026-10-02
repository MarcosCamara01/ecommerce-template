"use client";

import { useCartDetails } from "@/hooks/cart";
import { Skeleton } from "@/components/ui/skeleton";
import { swatchBackground } from "@/constants/colors";
import { merchantPlaceholders } from "@/constants/merchant";
import type { CartItemWithDetails } from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import { ButtonCheckout } from "./ButtonCheckout";
import { CartProduct } from "./CartProduct";

const LockIcon = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
  >
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** A bar split by the colour of each line, weighted by quantity. */
const ColourBar = ({ items, className }: { items: CartItemWithDetails[]; className?: string }) => (
  <div
    aria-hidden="true"
    className={`flex gap-[3px] overflow-hidden rounded-pill p-0.5 shadow-[inset_0_0_0_1px_var(--line)] ${className ?? ""}`}
  >
    {items.map((item) => (
      <span
        key={item.id}
        className="rounded-pill shadow-[inset_0_0_0_1px_var(--line)]"
        style={{ flexGrow: item.quantity, background: swatchBackground(item.variant.color) }}
      />
    ))}
  </div>
);

export const CartProducts = ({ emptyState }: { emptyState: React.ReactNode }) => {
  const { items, isPending } = useCartDetails();

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading your bag" className="flex flex-col border-t border-line">
        {[0, 1].map((key) => (
          <div key={key} className="grid grid-cols-[80px_1fr] gap-3 border-b border-line py-3 lg:grid-cols-[150px_1fr] lg:gap-6 lg:py-5">
            <Skeleton className="h-[104px] rounded-field lg:h-[196px] lg:rounded-toast" />
            <div className="flex flex-col gap-2 pt-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return <>{emptyState}</>;

  const subtotal = formatPriceFromEuros(
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );
  const cartItemIds = items.map((item) => item.id);

  return (
    <div data-fixed-cta="" className="grid items-start gap-12 pb-48 lg:grid-cols-[minmax(0,1fr)_440px] lg:pb-0">
      <div className="flex flex-col border-t border-line">
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
      </div>

      {/* Desktop summary */}
      <aside
        aria-label="Order summary"
        className="sticky top-[100px] hidden flex-col gap-[18px] rounded-photo-lg border border-line bg-fg/5 p-6 lg:flex"
      >
        <div className="flex flex-col gap-2">
          <ColourBar items={items} className="h-3" />
          <span className="text-xs text-muted">The colours in your bag</span>
        </div>
        <dl className="flex flex-col gap-2.5 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{subtotal}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Shipping</dt>
            <dd className="text-right">{merchantPlaceholders.shipping}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <dt className="font-medium">Total</dt>
            <dd className="font-display-75 text-[44px] font-extrabold leading-none">{subtotal}</dd>
          </div>
        </dl>
        <ButtonCheckout cartItemIds={cartItemIds} className="h-16 text-base">
          <LockIcon />
          Checkout securely
        </ButtonCheckout>
        <p className="text-center text-xs text-muted">
          You&apos;ll pay on Stripe&apos;s secure page, then come back here.
        </p>
      </aside>

      {/* Phone checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-3 border-t border-line bg-bg px-4 pb-6 pt-4 lg:hidden">
        <ColourBar items={items} className="h-2.5" />
        <div className="flex justify-between text-13 text-muted">
          <span>Shipping</span>
          <span>{merchantPlaceholders.shipping}</span>
        </div>
        <ButtonCheckout cartItemIds={cartItemIds} className="h-[60px] text-base">
          Checkout securely · {subtotal}
        </ButtonCheckout>
      </div>
    </div>
  );
};

/** Title suffix with the live piece count: "Bag (3)". */
export const BagCount = () => {
  const { items, isSuccess } = useCartDetails();
  if (!isSuccess) return null;
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return <span className="opacity-60"> ({count})</span>;
};

