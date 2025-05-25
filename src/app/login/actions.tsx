"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  try {
    const supabase = await createClient();

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    if (!data.email || !data.password) {
      redirect("/login?error=Por favor ingresa email y contraseña");
    }

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    console.error("Error en login:", error);
    redirect("/login?error=Error when trying to login");
  }
}
