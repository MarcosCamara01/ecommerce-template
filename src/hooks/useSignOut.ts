"use client";

/** FUNCTIONALITY */
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSignOut = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error signing out");
    },
  });
};
