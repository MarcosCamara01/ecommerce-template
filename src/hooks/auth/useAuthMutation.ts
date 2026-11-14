import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { safeLocalCallback } from "@/lib/auth/local-callback";

export const useAuthMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Every cached query is keyed by user id, and the client never refetches on
  // its own (refetchOnMount/Focus/Reconnect are all off). An identity change
  // must therefore drop the whole cache, or the next session reads the
  // previous one's cart and wishlist.
  const resetIdentityCache = () => {
    queryClient.clear();
  };

  const signIn = useMutation({
    mutationFn: async ({
      email,
      password,
      callbackURL,
    }: {
      email: string;
      password: string;
      callbackURL?: string;
    }) => {
      const destination = safeLocalCallback(callbackURL);
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: destination,
      });

      if (result.error) {
        throw Object.assign(
          new Error(result.error.message || "Invalid email or password"),
          { code: result.error.code },
        );
      }

      return result;
    },
    onSuccess: (_, variables) => {
      resetIdentityCache();
      router.push(safeLocalCallback(variables.callbackURL));
      router.refresh();
    },
    // The page shows the error inline, beside the fields.
    onError: (error) => {
      console.error(error);
    },
  });

  const signUp = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
      callbackURL,
    }: {
      email: string;
      password: string;
      name: string;
      callbackURL?: string;
    }) => {
      const destination = safeLocalCallback(callbackURL);
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: destination,
      });

      if (result.error) {
        throw Object.assign(
          new Error(result.error.message || "Error creating account"),
          { code: result.error.code },
        );
      }

      return result;
    },
    onSuccess: (result, variables) => {
      resetIdentityCache();
      if (!result.data?.token) {
        toast.error("Could not start a session after creating the account.");
        router.push("/login");
        return;
      }

      router.push(safeLocalCallback(variables.callbackURL));
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const signInWithGoogle = useMutation({
    mutationFn: async ({ callbackURL }: { callbackURL?: string }) => {
      const destination = safeLocalCallback(callbackURL);
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: destination,
      });

      if (result.error) {
        throw new Error(result.error.message || "Error signing in with Google");
      }

      return result;
    },
    onSuccess: () => {
      resetIdentityCache();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Couldn’t sign you in with Google. Try again.");
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message || "Error signing out");
      }
    },
    onSuccess: () => {
      resetIdentityCache();
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Couldn’t sign you out. Try again.");
    },
  });

  return {
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
};
