import { Products } from "@/components/products/Products";
import Link from "next/link";
import { getItems } from "./action";
import { Suspense } from "react";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { getUser } from "@/libs/supabase/auth/getUser";

export async function generateMetadata() {
  return {
    title: "Wishlists | Ecommerce Template",
    description: `Wishlists at e-commerce template made by Marcos Cámara`,
  };
}

const Wishlists = async () => {
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
        <ProductsWishlists />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
      <p className="mb-4 text-lg">
        Not registered? You must be in order to save your favorite products.
      </p>
      <Link
        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
        href="/login"
      >
        Login
      </Link>
    </div>
  );
};

const ProductsWishlists = async () => {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const filteredWishlist = await getItems(user.id);

  if (filteredWishlist && filteredWishlist?.length > 0) {
    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLISTS</h2>
        <Products
          products={filteredWishlist}
          extraClassname={"colums-mobile"}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to the wishlist, it will appear here. Want
        to get started?
      </p>
      <Link
        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
        href="/"
      >
        Start
      </Link>
    </div>
  );
};

export default Wishlists;
