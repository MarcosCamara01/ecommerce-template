/** ACTIONS */
import { login } from "./actions";
/** COMPONENTS */
import { PasswordInput } from "@/components/ui/form/PasswordInput";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/form/SubmitButton";
/** ICONS */
import { FaGoogle } from "react-icons/fa6";
import { MdError } from "react-icons/md";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const Login = async ({ searchParams }: LoginPageProps) => {
  const { error } = await searchParams;

  return (
    <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
      <form
        className="p-6 xs:p-10	w-full max-w-350 flex flex-col justify-between items-center gap-2.5	border border-solid border-[#2E2E2E] bg-[#0A0A0A] rounded-md"
        action={login}
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
          type="email"
          placeholder="Email"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="email"
          required
        />

        <label className="w-full text-sm">Password:</label>
        <PasswordInput name="password" required />

        <SubmitButton text="Sign in" />

        <div className="relative flex items-center justify-center w-full h-10">
          <div className="absolute w-full h-px top-2/4 bg-[#2E2E2E]"></div>
          <p className="z-10 flex items-center justify-center w-8 h-6 bg-[#0A0A0A]">
            or
          </p>
        </div>

        <button
          className="flex text-[#A1A1A1] items-center gap-3 px-4 py-2 text-sm align-middle transition-all bg-black border border-solid rounded border-[#2E2E2E] ease hover:bg-[#1F1F1F] hover:border-[#454545]"
          formAction="/api/auth/google"
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

export default Login;
