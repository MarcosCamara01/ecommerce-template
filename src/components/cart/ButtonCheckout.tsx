"use client";

/** FUNCTIONALITY */
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import { useMutation } from "@tanstack/react-query";
/** COMPONENTS */
import LoadingButton from "@/components/ui/loadingButton";
/** TYPES */
import type { CartItem } from "@/lib/db/drizzle/schema";

interface ButtonCheckoutProps {
  cartItemIds: CartItem["id"][];
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const ButtonCheckout = ({
  cartItemIds,
  className,
  children = "Checkout",
  icon,
}: ButtonCheckoutProps) => {
  const { data: session } = useSession();

  const { mutate: buyProducts, isPending } = useMutation({
    mutationFn: async () => {
      if (!session?.user) {
        throw new Error("User information not found");
      }

      const response = await fetch("/api/stripe/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Error processing checkout";
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("Checkout URL is not available");
      }

      window.location.assign(data.url);
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request. Please try again.",
      );
    },
  });

  return (
    <LoadingButton
      onClick={() => buyProducts()}
      className={className}
      loading={isPending}
      icon={icon}
      disabled={cartItemIds.length === 0}
    >
      {children}
    </LoadingButton>
  );
};
