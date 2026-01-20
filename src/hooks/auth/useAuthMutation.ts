import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuthMutation = () => {
  const router = useRouter();

  const signIn = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid email or password");
      }

      return result;
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error signing in");
    },
  });

  const signUp = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/",
      });

      if (result.error) {
        throw new Error(result.error.message || "Error creating account");
      }

      return result;
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error signing up");
    },
  });

  const signInWithGoogle = useMutation({
    mutationFn: async () => {
      return await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    },
    onSuccess: () => {
      router.push("/");
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
