// Auth API service

import { authClient } from "@/lib/auth/client";
import type { SignInInput, SignUpInput } from "@/schemas";

export async function signInWithEmail(credentials: SignInInput) {
  try {
    const result = await authClient.signIn.email(credentials);
    return result;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function signUpWithEmail(credentials: SignUpInput) {
  try {
    const result = await authClient.signUp.email(credentials);
    return result;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    const result = await authClient.signIn.social({
      provider: "google",
    });
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    const result = await authClient.signOut();
    return result;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
