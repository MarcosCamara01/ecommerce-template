import Link from "next/link";
import { Suspense } from "react";

import { getAllProducts } from "@/app/actions";
import { CartProducts } from "@/components/cart";
import { BagCount } from "@/components/cart/CartProducts";
import { RailCard } from "@/components/products/RailCard";
import { buttonClass } from "@/components/ui/button-classes";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getPrincipal } from "@/lib/identity";

export async function generateMetadata() {
  return {
    title: "Bag | Ecommerce Template",
    description: "View the products saved in your shopping bag.",
  };
}

const CartPage = () => {
  return (
    <section data-bag-page="" className="flex flex-col gap-6 pb-24 lg:gap-8">
      {/* Phones: back and theme only, like the canvas bag. */}
      <div className="-mx-2 flex h-14 items-center justify-between lg:hidden">
        <Link
          href="/new-in"
          aria-label="Continue shopping"
          className="press grid size-11 place-items-center rounded-pill"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <ThemeToggle />
      </div>
      <h1 className="font-display text-[120px] leading-[0.8] lg:pt-10 lg:text-[min(240px,16.6vw)]">
        Bag
        <Suspense fallback={null}>
          <BagCount />
        </Suspense>
      </h1>
      <Suspense fallback={<Skeleton className="h-40 rounded-photo" />}>
        <CartContent />
      </Suspense>
    </section>
  );
};

const CartContent = async () => {
  const user = await getPrincipal();

  if (!user) {
    return (
      <EmptyBag
        title="Your bag is empty"
        body="Not registered? You must be in order to save your products in the shopping cart."
        actions={
          <>
            <Link href="/login" className={buttonClass()}>
              Sign in
            </Link>
            <Link href="/new-in" className={buttonClass({ variant: "secondary" })}>
              See what&apos;s new
            </Link>
          </>
        }
      />
    );
  }

  return (
    <CartProducts
      emptyState={
        <EmptyBag
          title="Your bag is empty"
          body="Anything you add shows up here, ready for checkout."
          actions={
            <>
              <Link href="/new-in" className={buttonClass()}>
                See what&apos;s new
              </Link>
              <Link href="/wishlist" className={buttonClass({ variant: "secondary" })}>
                Open wishlist
              </Link>
            </>
          }
        />
      }
    />
  );
};

function EmptyBag({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-12 border-t border-line pt-8">
      <div className="flex flex-col items-start gap-[18px]">
        <h2 className="font-display text-[56px] leading-[0.85] lg:text-[min(120px,8.3vw)]">
          {title}
        </h2>
        <p className="max-w-[520px] text-base lg:text-lg">{body}</p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <Suspense fallback={null}>
        <Starters />
      </Suspense>
    </div>
  );
}

async function Starters() {
  const starters = (await getAllProducts())
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 4);
  if (starters.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-13 font-semibold uppercase tracking-[0.08em]">Start with these</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
        {starters.map((product) => (
          <RailCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default CartPage;
