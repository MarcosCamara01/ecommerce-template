"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  if (!data.email || !data.password) {
    const cookieStore = await cookies();
    cookieStore.set("login-error", "Please enter email and password", {
      maxAge: 3,
      path: "/login",
      httpOnly: true,
      sameSite: "lax",
    });
    redirect("/login");
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Error at login actions", error);
    const cookieStore = await cookies();
    cookieStore.set("login-error", error.message, {
      maxAge: 3,
      path: "/login",
      httpOnly: true,
      sameSite: "lax",
    });
    redirect("/login");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
