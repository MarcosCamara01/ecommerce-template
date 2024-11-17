"use client";

import axios from "axios";
import { ItemDocument } from "@/types/types";
import { useTransition, useCallback, useMemo } from "react";
import { Loader } from "../common/Loader";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

interface ButtonCheckoutProps {
  cartWithProducts: ItemDocument[];
}

const ButtonCheckout = ({ cartWithProducts }: ButtonCheckoutProps) => {
  let [isPending, startTransition] = useTransition();
  const { user } = useUser();

  const lineItems = useMemo(
    () =>
      cartWithProducts.map((cartItem: ItemDocument) => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        variantId: cartItem.variantId,
        size: cartItem.size,
        color: cartItem.color,
      })),
    [cartWithProducts]
  );

  const buyProducts = useCallback(async () => {
    if (!user) {
      toast.error("User information not found");
      return;
    }

    try {
      const { data } = await axios.post("/api/stripe/payment", {
        lineItems,
        userId: user.id,
      });

      if (data.statusCode === 500) {
        toast.error(data.message);
        console.error(data.statusCode, data.message);
        return;
      }

      window.location.href = data.session.url;
    } catch (error) {
      console.error(error);
      toast.error(
        "An error occurred while processing your request. Please try again."
      );
    }
  }, [user, lineItems]);

  return (
    <button
      onClick={() => startTransition(buyProducts)}
      className="w-full text-sm p-2.5 h-full transition-all hover:bg-color-secondary"
    >
      {isPending ? <Loader height={20} width={20} /> : "Continue"}
    </button>
  );
};

export default ButtonCheckout;
