"use client";

import Link from "next/link";

import { useSession } from "@/lib/auth/client";

/** "Sign in" for guests; signed-in visitors already have Orders and Wishlist. */
export function FooterAccountLink() {
  const { data: session, isPending } = useSession();
  if (isPending || session?.user) return null;

  return (
    <Link href="/login" className="hover:underline hover:underline-offset-[3px]">
      Sign in
    </Link>
  );
}
