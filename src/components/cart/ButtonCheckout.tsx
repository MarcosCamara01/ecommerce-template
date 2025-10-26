"use client";

import axios from "axios";
import { toast } from "sonner";
import { useSession } from "@/libs/auth/client";
import LoadingButton from "../ui/loadingButton";
import { useMutation } from "@tanstack/react-query";
import type { ProductWithVariants } from "@/schemas/ecommerce";

interface ButtonCheckoutProps {
  cartProducts: ProductWithVariants[];
}

const ButtonCheckout = ({ cartProducts }: ButtonCheckoutProps) => {
  const { data: session } = useSession();

  const { mutate: buyProducts, isPending } = useMutation({
    mutationFn: async () => {
      if (!session?.user) {
        throw new Error("User information not found");
      }

      const { data } = await axios.post("/api/stripe/payment", {
        lineItems: cartProducts,
        userId: session.user.id,
      });

      if (data.statusCode === 500) {
        throw new Error(data.message);
      }

      window.location.href = data.session.url;
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request. Please try again."
      );
    },
  });

  return (
    <LoadingButton
      onClick={() => buyProducts()}
      className="w-full rounded-none bg-background-secondary p-2.5 h-full transition-all hover:bg-background-tertiary"
      loading={isPending}
    >
      Continue
    </LoadingButton>
  );
};

export default ButtonCheckout;
