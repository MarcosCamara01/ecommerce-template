import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createSSRClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The call of a Server Component can be ignored
            // if you have middleware that refreshes sessions
          }
        },
      },
    }
  );
};

export const supabase = createSSRClient();
