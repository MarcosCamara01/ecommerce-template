import { supabase } from "@/libs/supabase";

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
};