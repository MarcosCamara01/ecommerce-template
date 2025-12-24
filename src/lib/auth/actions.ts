import { authClient } from "./client";
import type { SignInInput, SignUpInput } from "@/schemas";

export async function signInWithEmail(credentials: SignInInput) {
  try {
    return await authClient.signIn.email(credentials);
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function signUpWithEmail(credentials: SignUpInput) {
  try {
    return await authClient.signUp.email(credentials);
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    return await authClient.signIn.social({ provider: "google" });
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    return await authClient.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
