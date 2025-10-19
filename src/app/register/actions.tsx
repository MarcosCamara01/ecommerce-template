"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function register(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
      },
    },
  };

  if (!data.email || !data.password || !data.options.data.name) {
    const cookieStore = await cookies();
    cookieStore.set(
      "register-error",
      "Por favor complete los campos requeridos",
      {
        maxAge: 3,
        path: "/register",
        httpOnly: true,
        sameSite: "lax",
      }
    );
    redirect("/register");
  }

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.error("Error at register actions", error);
    const cookieStore = await cookies();
    cookieStore.set("register-error", error.message, {
      maxAge: 3,
      path: "/register",
      httpOnly: true,
      sameSite: "lax",
    });
    redirect("/register");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
