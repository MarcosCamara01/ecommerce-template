import { Products } from "@/components/products/Products";
import { ButtonCheckout } from "@/components/cart/ButtonCheckout";
import Link from "next/link";
import { getItems } from "./action";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { Suspense } from "react";
import { Loader } from "@/components/common/Loader";

export async function generateMetadata() {
  return {
    title: "Cart | Ecommerce Template",
    description: `Cart at e-commerce template made by Marcos Cámara`,
  };
}

const CartPage = async () => {
  const session: Session | null = await getServerSession(authOptions);
  let filteredCart;
  let totalPrice;

  if (session) {
    const calculateTotalPrice = (cart: any) => {
      let totalPrice = 0;

      if (cart) {
        for (const cartItem of cart) {
          totalPrice += cartItem.price * cartItem.quantity;
        }
      }

      return totalPrice.toFixed(2);
    };
    filteredCart = await getItems(session.user._id);
    totalPrice = calculateTotalPrice(filteredCart);
  }

  return (
    <Suspense
      fallback={<div className="flex items-center justify-center height-loader">
        <Loader height={35} width={35} />
      </div>}>
      <div className="pt-12">
        {
          session?.user ?
            filteredCart && filteredCart?.length > 0 ?
              <>
                <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR SHOPPING CART</h2>
                <Products
                  products={filteredCart}
                  extraClassname={"cart-ord-mobile"}
                />

                <div className="fixed left-[50%] translate-x-[-50%] bottom-4 w-[90%] z-10 sm:w-[360px] rounded-xl overflow-hidden flex bg-black border border-solid border-border-primary h-min">
                  <div className="flex flex-col p-2.5 justify-center w-1/2 gap-2 text-center">
                    <div className="flex gap-2.5 justify-center">
                      <span>Total:</span>
                      <span>{totalPrice}€</span>
                    </div>
                    <span className="text-xs">+ TAX INCL.</span>
                  </div>
                  <div className="w-1/2">
                    <ButtonCheckout
                      session={session}
                      cartWithProducts={filteredCart}
                    />
                  </div>
                </div>
              </>
              :
              <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
                <h1 className="mb-6 text-4xl font-bold">YOUR CART IS EMPTY</h1>
                <p className="mb-4 text-lg">When you have added something to your cart, it will appear here. Want to get started?</p>
                <Link
                  className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                  href="/"
                >
                  Start
                </Link>
              </div>

            :
            <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
              <h1 className="mb-6 text-4xl font-bold">YOUR CART IS EMPTY</h1>
              <p className="mb-4 text-lg">
                Not registered? You must be in order to save your products in the shopping cart.
              </p>
              <Link
                className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                href="/login"
              >
                Login
              </Link>
            </div>
        }
      </div>
    </Suspense>
  );
}

export default CartPage;
