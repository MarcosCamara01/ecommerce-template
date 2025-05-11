import { GridProducts } from "@/components/products/GridProducts";
import { ProductItem } from "@/components/products/item";
import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getUser } from "@/libs/supabase/auth/getUser";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { getCartProducts } from "@/app/actions";

const ButtonCheckout = dynamic(
  () => import("../../../components/cart/ButtonCheckout"),
  {
    loading: () => (
      <p className="flex items-center justify-center w-full h-full text-sm">
        Continue
      </p>
    ),
  }
);

export async function generateMetadata() {
  return {
    title: "Cart | Ecommerce Template",
    description: `Cart at e-commerce template made by Marcos Cámara`,
  };
}

const CartPage = async () => {
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
        <ProductsCart />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR CART IS EMPTY</h1>
      <p className="mb-4 text-lg">
        Not registered? You must be in order to save your products in the
        shopping cart.
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

const ProductsCart = async () => {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const cartProducts = await getCartProducts();

  const totalPrice = !cartProducts?.length
    ? "0.00"
    : cartProducts
        .reduce(
          (sum, product) =>
            sum + product.price * (product.cart_item?.quantity || 0),
          0
        )
        .toFixed(2);

  if (cartProducts && cartProducts.length > 0) {
    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">
          YOUR SHOPPING CART
        </h2>
        <GridProducts className="grid-cols-1">
          {cartProducts.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </GridProducts>

        <div className="fixed left-[50%] translate-x-[-50%] bottom-4 w-[90%] z-10 sm:w-[360px] rounded-xl overflow-hidden flex bg-black border border-solid border-border-primary h-min">
          <div className="flex flex-col p-2.5 justify-center w-1/2 gap-2 text-center">
            <div className="flex gap-2.5 justify-center text-sm">
              <span>Total:</span>
              <span>{totalPrice}€</span>
            </div>
            <span className="text-xs">+ TAX INCL.</span>
          </div>
          <div className="w-1/2 border-l border-solid bg-background-secondary border-border-primary">
            <ButtonCheckout cartProducts={cartProducts} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR CART IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to your cart, it will appear here. Want to
        get started?
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

export default CartPage;
