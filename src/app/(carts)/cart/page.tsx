import { Products } from "@/components/products/Products";
import { ButtonCheckout } from "@/components/cart/CartElements";
import Link from "next/link";
import { getItems } from "./action";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

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
    <div className="pt-12">
      {
        filteredCart && filteredCart?.length > 0 ?
          <>
            <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR SHOPPING CART</h2>
            <Products
              products={filteredCart}
              extraClassname={"cart-ord-mobile"}
            />

            <div className="fixed right-0 flex justify-center w-full text-sm bottom-4">
              <div className="w-[90%] sm:w-[360px] rounded-xl overflow-hidden flex bg-black border border-solid border-border-primary h-min">
                <div className="flex flex-col p-2.5 justify-center w-1/2 gap-2 text-center">
                  <div className="flex gap-2.5 justify-center">
                    <span>Total:</span>
                    <span>{totalPrice}€</span>
                  </div>
                  <span className="text-xs">+ TAX INCL.</span>
                </div>
                <div className="w-1/2">
                  <ButtonCheckout
                    cartWithProducts={filteredCart}
                  />
                </div>
              </div>
            </div>
          </>
          :
          <div className="flex flex-col gap-2">
            <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR CART IS EMPTY</h2>
            {session?.user ?
              <>
                <p>When you have added something to your cart, it will appear here. Want to get started?</p>
                <span><Link href="/">Start</Link></span>
              </>
              :
              <>
                <p>Not registered? You must be in order to save your products in the shopping cart.</p>
                <span><Link href="/login">Login</Link></span>
              </>
            }
          </div>
      }
    </div>
  );
}

export default CartPage;
