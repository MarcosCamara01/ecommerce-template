import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

export const getUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data.user;
};
