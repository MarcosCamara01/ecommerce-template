import axios from "axios";
import { getProducts } from "./getProducts";
import { Session } from "next-auth";
import { CartDocument, ItemDocument, VariantsDocument } from "@/types/types";

export const fetchUserCart = async (session: Session, setCartLoading: any) => {
  try {
    const userId = await session.user._id;
    const response = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart?userId=${userId}`);
    const userCart = response.data;
    setCartLoading(false);
    return userCart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    setCartLoading(false);
  }

  return null;
};

export const productsWislists = async (
  userCart: CartDocument,
  cartLoading: boolean,
  setCartWithProducts: any,
  setIsLoading: any
) => {
  if (userCart && userCart?.favorites) {
    const updatedCart = await Promise.all(userCart.favorites.map(async (productId: any) => {
      const matchingProduct = await getProducts(`?_id=${productId}`);
      if (matchingProduct) {
        return {
          ...matchingProduct,
        };
      }
      return null;
    }));

    setCartWithProducts(updatedCart.reverse());
    setIsLoading(false);
  } else if (!cartLoading && userCart?.favorites) {
    setIsLoading(false)
  } else if (!cartLoading && !userCart) {
    setIsLoading(false)
  }
};

export const productsCart = async (
  cartItems: [ItemDocument],
  cartLoading: boolean,
  setCartWithProducts: any,
  setIsLoading: any,
  setTotalPrice: any
) => {
  if (cartItems.length >= 1) {
    const updatedCart = (await Promise.all(
      cartItems.map(async (cartItem: ItemDocument) => {
        try {
          const matchingProduct = await getProducts(`?_id=${cartItem.productId}`);
          if (matchingProduct) {
            const matchingVariant = matchingProduct.variants.find(
              (variant: VariantsDocument) => variant.color === cartItem.color
            );
            return {
              ...cartItem,
              category: matchingProduct.category,
              image: [matchingVariant.images[0]],
              name: matchingProduct.name,
              price: matchingProduct.price,
            };
          }
        } catch (error) {
          console.error("Error getting product details:", error);
        }
      })
    )) as ItemDocument[];

    const totalPrice = calculateTotalPrice(updatedCart);
    setCartWithProducts(updatedCart.reverse());
    setIsLoading(false);
    setTotalPrice(totalPrice);
  } else if (!cartLoading && cartItems) {
    setCartWithProducts([]);
    setIsLoading(false);
  }
};


const calculateTotalPrice = (cartItems: ItemDocument[]) => {
  let totalPrice = 0;

  for (const cartItem of cartItems) {
    totalPrice += cartItem?.price * cartItem?.quantity;
  }

  return totalPrice.toFixed(2);
};