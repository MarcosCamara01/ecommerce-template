import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/libs/supabase/auth/getUser";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { GridProducts } from "@/components/products/GridProducts";
import { ProductItem } from "@/components/products/item";
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
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-91px)]">
            <SVGLoadingIcon height={30} width={30} />
          </div>
        }
      >
        <ProductsWishlist />
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
        className="flex font-medium items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
        href="/login"
      >
        Login
      </Link>
    </div>
  );
};

const ProductsWishlist = async () => {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const wishlistProducts = await getAllProducts().then((products) =>
    products.filter((product) => !!product.wishlist_item)
  );

  if (wishlistProducts && wishlistProducts.length > 0) {
    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLIST</h2>
        <GridProducts className="grid-cols-auto-fill-110">
          {wishlistProducts.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </GridProducts>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to your wishlist, it will appear here.
        Want to get started?
      </p>
      <Link
        className="flex font-medium items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
        href="/"
      >
        Start
      </Link>
    </div>
  );
};

export default WishlistPage;
