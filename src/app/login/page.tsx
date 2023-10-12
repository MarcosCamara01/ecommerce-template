"use client";
import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import '../../styles/form.css';
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

const Signin = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
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

    if (res?.error) setError(res.error as string);

    if (res?.ok) return router.push("/");
  };

  return (
    <section className="login-register">
      <form
        onSubmit={handleSubmit}
      >
        {error && <div className="">{error}</div>}
        <h1 className="">Signin</h1>

        <label className="">Email:</label>
        <input
          type="email"
          placeholder="Email"
          className="bg-zinc-800 px-4 py-2 block mb-2 w-full"
          name="email"
        />

        <label className="">Password:</label>
        <input
          type="password"
          placeholder="Password"
          className=""
          name="password"
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
        <Link href="/register">Don&apos;t have an account?</Link>
      </form>
    </section>
  );
}

export default Signin;
