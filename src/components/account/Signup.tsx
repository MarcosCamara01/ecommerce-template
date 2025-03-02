"use client";

import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdError, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaGoogle } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import LoadingButton from "../ui/loadingButton";
import { supabase } from "@/libs/supabase";



const Signup = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const {mutate, isPending} = useMutation({
    mutationFn: async () => {
      if (!emailRef.current?.value || !passwordRef.current?.value || !nameRef.current?.value) {
        throw new Error("Please fill in all required fields");
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailRef.current.value,
        password: passwordRef.current.value,
        options: {
          data: {
            name: nameRef.current.value,
            phone: phoneRef.current?.value || ""
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onError: (error: any) => {
      setError(error.message);
    },
    onSuccess: (data) => {
      if (data.user) {
        router.push("/");
      }
    }
  });

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
        onSubmit={(e) => {
          e.preventDefault();
          mutate();
        }}
        className="p-6 xs:p-10 w-full max-w-350 flex flex-col justify-between items-center gap-2.5 border border-solid border-[#2E2E2E] bg-[#0A0A0A] rounded-md"
      >
        {error && (
          <div className="text-[#FF6166] flex items-center justify-center gap-2">
            <MdError />
            <div className="text-sm">{error}</div>
          </div>
        )}
        <h1 className="w-full mb-5 text-2xl font-bold">Signup</h1>

        <label className="w-full text-sm">Fullname:</label>
        <input
          ref={nameRef}
          type="text"
          required
          placeholder="Fullname"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="name"
        />

        <label className="w-full text-sm">Email:</label>
        <input
          ref={emailRef}
          type="email"
          required
          placeholder="Email"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="email"
        />

        <label className="w-full text-sm">Password:</label>
        <div className="flex w-full">
          <input
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-8 text-[#A1A1A1] border border-solid border-[#2E2E2E] bg-black py-1 px-2.5 rounded-l text-13"
            name="password"
          />
          <button
            className="flex items-center text-[#A1A1A1] justify-center w-2/12 transition-all duration-150 border-[#2E2E2E] bg-black border-r border-solid rounded-r border-y ease hover:bg-[#1F1F1F]"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? <MdVisibility /> : <MdVisibilityOff />}
          </button>
        </div>

        <label className="w-full text-sm">Phone:</label>
        <input
          ref={phoneRef}
          type="text"
          placeholder="Phone (not required)"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="phone"
        />

        <LoadingButton
          className="w-full bg-black border border-solid border-[#2E2E2E] py-1.5 mt-2.5 rounded transition-all hover:bg-[#1F1F1F] hover:border-[#454545] text-13"
          type="submit"
          loading={isPending}
        >
          {isPending ? "Signing up..." : "Signup"}
        </LoadingButton>

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
          href="/login"
          className="text-sm transition duration-150 text-[#A1A1A1] ease hover:text-white"
        >
          Already have an account?
        </Link>
      </form>
    </section>
  );
};

export default Signup;
