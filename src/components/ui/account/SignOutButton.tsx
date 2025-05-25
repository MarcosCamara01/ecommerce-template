"use client";

/** FUNCTIONALITY */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
/** ICONS */
import { RiLogoutBoxLine } from "react-icons/ri";

const SignOutButton = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <button className="flex items-center w-full h-full" onClick={handleSignOut}>
      <RiLogoutBoxLine className="mr-2 w-4 h-4" />
      <span>Log out</span>
    </button>
  );
};

export default SignOutButton;
