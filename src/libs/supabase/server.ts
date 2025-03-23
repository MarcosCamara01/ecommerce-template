import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createSSRClient = () => {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The call of a Server Component can be ignored
            // if you have middleware that refreshes sessions
          }
        }
      }
    }
  );
}; 