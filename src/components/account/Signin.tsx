"use client";

import { FormEvent, useCallback, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdError, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaGoogle } from "react-icons/fa";
import { supabase } from "@/libs/supabase";


const Signin = () => {
  const router = useRouter();

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        router.push("/");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleGoogleSignIn = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); 
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
      <form
        className="p-6 xs:p-10	w-full max-w-350 flex flex-col justify-between items-center gap-2.5	
                border border-solid border-[#2E2E2E] bg-[#0A0A0A] rounded-md"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="text-[#FF6166] flex items-center justify-center gap-2">
            <MdError />
            <div className="text-sm">{error}</div>
          </div>
        )}
        <h1 className="w-full mb-5 text-2xl font-bold">Signin</h1>

        <label className="w-full text-sm">Email:</label>
        <input
          ref={emailRef}
          onChange={() => setError("")}
          type="email"
          placeholder="Email"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="email"
        />

        <label className={labelStyles}>Password:</label>
        <div className="flex w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded-l bg-black text-13"
            name="password"
          />
          <button
            className="flex text-[#A1A1A1] items-center justify-center w-2/12 transition duration-150 bg-black border-r border-solid rounded-r border-y border-[#2E2E2E] ease hover:bg-[#1F1F1F]"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? <MdVisibility /> : <MdVisibilityOff />}
          </button>
        </div>
        <button
          className="w-full bg-black border border-solid border-[#2E2E2E] py-1.5 mt-2.5 rounded transition-all hover:bg-[#1F1F1F] hover:border-[#454545] text-13"
          type="submit"
        >
          Sign in
        </button>

        <div className="relative flex items-center justify-center w-full h-10">
          <div className="absolute w-full h-px top-2/4 bg-[#2E2E2E]"></div>
          <p className="z-10 flex items-center justify-center w-8 h-6 bg-[#0A0A0A]">
            or
          </p>
        </div>

        <button
          className="flex text-[#A1A1A1] items-center gap-3 px-4 py-2 text-sm align-middle transition-all bg-black border border-solid rounded border-[#2E2E2E] ease hover:bg-[#1F1F1F] hover:border-[#454545]"
          onClick={handleGoogleSignIn}
          type="button"
        >
          <FaGoogle />
          Sign in with Google
        </button>
        <Link
          href="/register"
          className="text-sm transition duration-150 text-[#A1A1A1] ease hover:text-white"
        >
          Don&apos;t have an account?
        </Link>
      </form>
    </section>
  );
};

export default Signin;
