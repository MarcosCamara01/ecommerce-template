"use client";

import axios from "axios";
import { ItemDocument } from "@/types/types";
import { useMemo } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import LoadingButton from "../ui/loadingButton";
import { useMutation } from "@tanstack/react-query";

interface ButtonCheckoutProps {
  cartWithProducts: ItemDocument[];
}

const ButtonCheckout = ({ cartWithProducts }: ButtonCheckoutProps) => {
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

  const { mutate: buyProducts, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User information not found");
      }

      const { data } = await axios.post("/api/stripe/payment", {
        lineItems,
        userId: user.id,
      });

      if (data.statusCode === 500) {
        throw new Error(data.message);
      }

      window.location.href = data.session.url;
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An error occurred while processing your request. Please try again.");
    }
  });

  return (
    <LoadingButton
      onClick={() => buyProducts()}
      className="w-full text-sm p-2.5 h-full transition-all hover:bg-color-secondary"
      loading={isPending}
    >
      Continue
    </LoadingButton>
  );
};

export default ButtonCheckout;
