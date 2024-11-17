import React from "react";
import { redirect } from "next/navigation";
import Signin from "@/components/account/Signin";
import { getUser } from "@/libs/supabase/auth/getUser";

const Login = async () => {
  const user = await getUser();

  if (user) {
    redirect("/");
  } else {
    return <Signin />;
  }
};

export default Login;
