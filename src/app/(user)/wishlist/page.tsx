import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/auth/server";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { WishlistProducts } from "@/components/wishlist";
import { getAllProducts } from "@/app/actions";

export async function generateMetadata() {
  return {
    title: "Wishlist | Ecommerce Template",
    description: `Wishlist at e-commerce template made by Marcos Cámara`,
  };
}

const WishlistPage = async () => {
  const user = await getUser();

  if (user) {
    const allProducts = await getAllProducts();

    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-91px)]">
            <SVGLoadingIcon height={30} width={30} />
          </div>
        }
      >
        <WishlistProducts allProducts={allProducts} />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
      <p className="mb-4 text-lg">
        Not registered? You must be in order to save your products in the
        wishlist.
      </p>
      <Link
        className="flex font-medium items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-background-tertiary hover:border-[#454545]"
        href="/login"
      >
        Login
      </Link>
    </div>
  );
};

export default WishlistPage;
