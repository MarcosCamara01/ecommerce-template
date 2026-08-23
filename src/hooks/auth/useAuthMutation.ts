import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { safeLocalCallback } from "@/lib/auth/local-callback";

export const useAuthMutation = () => {
  const router = useRouter();

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
        throw new Error(result.error.message || "Invalid email or password");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      router.push(safeLocalCallback(variables.callbackURL));
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      // Surface the real reason: an unverified address fails with a specific
      // message that the user needs to act on, not a generic failure.
      toast.error(error.message || "Error signing in");
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
        throw new Error(result.error.message || "Error creating account");
      }

      return result;
    },
    onSuccess: (result, variables) => {
      const destination = safeLocalCallback(variables.callbackURL);
      // When email verification is required, sign-up does not open a session:
      // the account stays inert until the address is confirmed. Sending the
      // user to the home page would look like a silent no-op login.
      if (!result.data?.token) {
        toast.success("Check your email to confirm your address before signing in.");
        const redirect = destination === "/"
          ? ""
          : `?redirect=${encodeURIComponent(destination)}`;
        router.push(`/login${redirect}`);
        return;
      }

      router.push(destination);
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || "Error signing up");
    },
  });

  const signInWithGoogle = useMutation({
    mutationFn: async ({ callbackURL }: { callbackURL?: string }) => {
      const destination = safeLocalCallback(callbackURL);
      return await authClient.signIn.social({
        provider: "google",
        callbackURL: destination,
      });
    },
    onSuccess: (_, variables) => {
      router.push(safeLocalCallback(variables.callbackURL));
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error signing in with Google");
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error signing out");
    },
  });

  return {
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
};
