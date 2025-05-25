import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

export const getUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  console.log("data", data);
  console.log("error", error);

  if (error || !data.user) {
    return null;
  }

  return data.user;
};
