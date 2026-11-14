import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
  // On a Vercel Preview the proxy keeps visitors on the branch URL, which
  // NEXT_PUBLIC_APP_URL does not track, so the browser calls its own origin.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
});

export const { useSession } = authClient;
