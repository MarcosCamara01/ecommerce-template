"use client";
import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import '../../styles/form.css';
import Link from "next/link";

function Signin() {
  const [error, setError] = useState("");
  const router = useRouter();

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
    <div className="login-register">
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

        <button className="">
          Signup
        </button>
        <Link href="/register">Don't have an account?</Link>
      </form>
    </div>
  );
}

export default Signin;
