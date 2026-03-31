import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Prefer same-origin requests in the browser so auth keeps working even if
  // the local dev server port changes from the env default.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
