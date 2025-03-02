"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { BiLogOut } from "react-icons/bi";

const SignOutButton = () => {
  return (
    <button
      className="flex items-center w-full h-full"
      onClick={() => signOut()}
    >
      <BiLogOut size={16} className="mr-2" />
      <span>Log out</span>
    </button>
  );
};

export default SignOutButton;
