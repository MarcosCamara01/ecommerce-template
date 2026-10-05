import Link from "@/components/ui/link";
import { Suspense } from "react";

import { getAllProducts } from "@/app/actions";
import { HeartIcon } from "@/components/icons";
import { RailCard } from "@/components/products/RailCard";
import { buttonClass } from "@/components/ui/button-classes";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistProducts } from "@/components/wishlist";
import { WishlistCount } from "@/components/wishlist/WishlistProducts";
import { getPrincipal } from "@/lib/identity";

export async function generateMetadata() {
  return {
    title: "Wishlist | Ecommerce Template",
    description: "View the products you saved to your wishlist.",
  };
}

const WishlistPage = () => {
  return (
    <section className="flex flex-col gap-5 pb-24 lg:gap-7">
      <div className="flex items-end justify-between gap-4 pt-3 lg:pt-12">
        {/* The title shares its row with the count: it scales down on narrow phones. */}
        <h1 className="font-display text-[min(88px,20vw)] leading-[0.8] lg:text-[min(240px,16vw)]">
          Wishlist
        </h1>
        <Suspense fallback={null}>
          <WishlistCount />
        </Suspense>
      </div>
      <Suspense fallback={<Skeleton className="h-40 rounded-photo" />}>
        <WishlistContent />
      </Suspense>
    </section>
  );
};

function EmptyWishlist({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col items-start gap-[18px] border-t border-line pt-7">
        <span className="grid size-14 place-items-center rounded-pill border-2 border-dashed border-fg">
          <HeartIcon size={22} />
        </span>
        <h2 className="font-display text-[56px] leading-[0.85] lg:text-[min(120px,8.3vw)]">
          {title}
        </h2>
        <p className="max-w-[520px] text-lg">{body}</p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <Suspense fallback={null}>
        <Starters />
      </Suspense>
    </div>
  );
}

async function Starters() {
  const starters = [...(await getAllProducts())]
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

const WishlistContent = async () => {
  const user = await getPrincipal();

  if (!user) {
    return (
      <EmptyWishlist
        title="Your wishlist is empty"
        body="Not registered? You must be in order to save your products in the wishlist."
        actions={
          <>
            <Link href="/login" className={buttonClass()}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClass({ variant: "secondary" })}>
              Create account
            </Link>
          </>
        }
      />
    );
  }

  return (
    <WishlistProducts
      emptyState={
        <EmptyWishlist
          title="Nothing saved yet"
          body="Tap the heart on any piece to keep it here for later."
          actions={
            <Link href="/new-in" className={buttonClass()}>
              See what&apos;s new
            </Link>
          }
        />
      }
    />
  );
};

export default WishlistPage;
