import Link from "next/link";
import { Suspense } from "react";

import { WishlistProducts } from "@/components/wishlist";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { getUser } from "@/lib/auth/server";

export async function generateMetadata() {
  return {
    title: "Wishlist | Ecommerce Template",
    description: "View the products you saved to your wishlist.",
  };
}

const WishlistPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-91px)]">
          <SVGLoadingIcon height={30} width={30} />
        </div>
      }
    >
      <WishlistContent />
    </Suspense>
  );
};

const WishlistContent = async () => {
  const user = await getUser();

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-91px)] w-full flex-col items-center justify-center gap-2 px-4">
        <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
        <p className="mb-4 text-lg">
          Not registered? You must be in order to save your products in the
          wishlist.
        </p>
        <Link
          className="flex h-[40px] min-w-[160px] max-w-[160px] items-center justify-center rounded-md border border-solid border-[#2E2E2E] bg-[#0C0C0C] px-[10px] text-sm font-medium transition-all hover:border-[#454545] hover:bg-background-tertiary"
          href="/login"
        >
          Login
        </Link>
      </div>
    );
  }

  return <WishlistProducts />;
};

export default WishlistPage;
