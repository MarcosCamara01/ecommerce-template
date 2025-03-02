import React from "react";
import { getUser } from "@/libs/supabase/auth/getUser";
import { redirect } from "next/navigation";
import Signup from "@/components/account/Signup";

const Register = async () => {
  const user = await getUser();

  if (user) {
    redirect("/");
  } else {
    return <Signup />;
  }
};

export default Register;
