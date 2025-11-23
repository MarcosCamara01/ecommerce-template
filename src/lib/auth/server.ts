import { auth } from "@/utils/auth";
import { headers } from "next/headers";

/**
 * Gets the session of the user in the server
 * Use this function in Server Components, Server Actions, or API Routes
 */
export async function getSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
}

/**
 * Gets the current user in the server
 * Returns null if there is no authenticated user
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Requires authentication in the server
 * Throws an error if there is no authenticated user
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
