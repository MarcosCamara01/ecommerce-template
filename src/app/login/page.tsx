"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { BiLogoGoogle } from 'react-icons/bi';
import { BiSolidShow } from 'react-icons/bi';
import { BiSolidHide } from 'react-icons/bi';

const Signin = () => {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const labelStyles = "w-full text-sm";

  useEffect(() => {
    if (session?.user) {
      router.push("/");
    }
  }, [session, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError(res.error as string)
    };

    if (!res?.error) {
      return router.push("/")
    };
  };

  return (
    <section className="w-full xs:h-80vh flex items-center justify-center pt-12">
      <form
        className="p-6 xs:p-10	w-full max-w-350 flex flex-col justify-between items-center gap-2.5	
        border border-solid border-border-primary bg-background-secondary rounded"
        onSubmit={handleSubmit}
      >
        {error && <div className="">{error}</div>}
        <h1 className="mb-5 w-full text-2xl	font-bold">Signin</h1>

        <label className={labelStyles}>Email:</label>
        <input
          type="email"
          placeholder="Email"
          className="w-full h-8 border border-solid border-border-primary py-1 px-2.5 rounded bg-black text-13"
          name="email"
        />

        <label className={labelStyles}>Password:</label>
        <div className="flex w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-8 border border-solid border-border-primary py-1 px-2.5 rounded-l bg-black text-13"
            name="password"
          />
          <button
            className="w-2/12	border-y border-r border-solid border-border-primary bg-black rounded-r 
          flex items-center justify-center transition duration-150 ease hover:bg-color-secondary"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword)
            }}
          >
            {showPassword ? <BiSolidHide /> : <BiSolidShow />}
          </button>
        </div>
        <button className="w-full bg-black border border-solid border-border-primary py-1.5 mt-2.5 rounded
        transition duration-150 ease hover:bg-color-secondary text-13"
        >
          Signup
        </button>

        <div className="w-full h-10	relative flex items-center justify-center">
          <div className="absolute h-px w-full top-2/4 bg-border-primary"></div>
          <p className="w-8	h-6 bg-background-secondary z-10	flex items-center justify-center">or</p>
        </div>

        <button
          className="flex py-2 px-4 text-sm	align-middle items-center rounded text-999 bg-black 
          border border-solid border-border-primary transition duration-150 ease hover:bg-color-secondary gap-3"
          onClick={(e) => {
            e.preventDefault();
            signIn("google")
          }}>
          <BiLogoGoogle className="text-2xl" /> Sign in with Google
        </button>
        <Link href="/register" className="text-sm	text-color-tertiary transition duration-150 ease hover:text-white">Don&apos;t have an account?</Link>
      </form>
    </section>
  );
}

export default Signin;
