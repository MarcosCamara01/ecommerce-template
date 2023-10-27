"use client";

import { FormEvent, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

import '@/styles/form.css';

const Signup = () => {
  const [error, setError] = useState();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const signupResponse = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/signup`, {
        email: formData.get("email"),
        password: formData.get("password"),
        name: formData.get("name"),
        phone: formData.get("phone"),
      });
  
      const res = await signIn("credentials", {
        email: signupResponse.data.email,
        password: formData.get("password"),
        redirect: false,
      });
  
      if (res?.ok) return router.push("/");
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data.message;
        setError(errorMessage);
      }
    }
  };

  return (
    <section className="login-register">
      <form onSubmit={handleSubmit} className="">
        {error && <div className="">{error}</div>}
        <h1 className="">Signup</h1>

        <label className="">Fullname:</label>
        <input
          type="text"
          placeholder="Fullname"
          className=""
          name="name"
        />

        <label className="text-slate-300">Email:</label>
        <input
          type="email"
          placeholder="Email"
          className=""
          name="email"
        />

        <label className="">Password:</label>
        <input
          type="password"
          placeholder="Password"
          className=""
          name="password"
        />

        <label className="">Phone:</label>
        <input
          type="text"
          placeholder="Phone (not required)"
          className=""
          name="phone"
        />

        <button className="signup-button">
          Signup
        </button>

        <div className="separator">
          <div></div>
          <p>or</p>
        </div>

        <button
          className="google-button"
          onClick={() => signIn("google")}>
          <FcGoogle /> Sign in with Google
        </button>
        <Link href="/login">Already have an account?</Link>
      </form>
    </section>
  );
}

export default Signup;
