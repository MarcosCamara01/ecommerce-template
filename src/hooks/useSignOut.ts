"use client";

/** FUNCTIONALITY */
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/libs/auth/client";

export const useSignOut = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
      router.refresh();
      router.push("/");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error signing out");
    },
  });
};
