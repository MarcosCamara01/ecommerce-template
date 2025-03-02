"use client";

/** FUNCTIONALITY */
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
/** COMPONENTS */
import { PasswordInput } from "./form/PasswordInput";
import Link from "next/link";
import { ErrorMessage } from "../ui/errorMessage";
/** ICONS */
import { FcGoogle } from "react-icons/fc";

const Signup = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [error, setError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      window.location.reload();
    }
  }, [session]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");

      const name = nameRef.current?.value;
      const email = emailRef.current?.value;
      const password = passwordRef.current?.value;
      const phone = phoneRef.current?.value;

      if (!email || !password || !name) {
        setError("Please fill in all required fields");
        return;
      }

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password,
            phone
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Something went wrong");
        }

        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setError(signInRes.error);
          return;
        }

        if (!signInRes?.error) {
          return router.push("/");
        }

      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      }
    },
    [router]
  );

  return (
    <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
      <form
        className="p-6 xs:p-10	w-full max-w-350 flex flex-col justify-between items-center gap-2.5	
                border border-solid border-[#2E2E2E] bg-[#0A0A0A] rounded-md"
        onSubmit={handleSubmit}
      >
        {error && <ErrorMessage message={error} />}
        <h1 className="w-full mb-5 text-2xl font-bold">Signup</h1>

        <label className="w-full text-sm">Fullname:</label>
        <input
          ref={nameRef}
          onChange={() => setError("")}
          type="text"
          required
          placeholder="Fullname"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="name"
        />

        <label className="w-full text-sm">Email:</label>
        <input
          ref={emailRef}
          onChange={() => setError("")}
          type="email"
          required
          placeholder="Email"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="email"
        />

        <label className="w-full text-sm">Password:</label>
        <PasswordInput ref={passwordRef} onChange={() => setError("")} />

        <label className="w-full text-sm">Phone:</label>
        <input
          ref={phoneRef}
          onChange={() => setError("")}
          type="text"
          placeholder="Phone (not required)"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="phone"
        />

        <button
          className="w-full bg-black border border-solid border-[#2E2E2E] py-1.5 mt-2.5 rounded transition-all hover:bg-[#1F1F1F] hover:border-[#454545] text-13"
          type="submit"
        >
          Signup
        </button>

        <div className="relative flex items-center justify-center w-full h-10">
          <div className="absolute w-full h-px top-2/4 bg-[#2E2E2E]"></div>
          <p className="z-10 flex items-center justify-center w-8 h-6 bg-[#0A0A0A]">
            or
          </p>
        </div>

        <button
          className="flex text-[#A1A1A1] items-center gap-3 px-4 py-2 text-sm align-middle transition-all bg-black border border-solid rounded border-[#2E2E2E] ease hover:bg-[#1F1F1F] hover:border-[#454545]"
          onClick={(e) => {
            e.preventDefault();
            signIn("google");
          }}
          type="button"
        >
          <FcGoogle size={20} /> Sign in with Google
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
