"use client";

import Link from "@/components/ui/link";

import { useAuthMutation } from "@/hooks/auth/useAuthMutation";
import { useHydrated } from "@/hooks/useHydrated";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

/** Asks the navigation to open the Edit profile dialog (it owns it). */
export const EDIT_PROFILE_EVENT = "store:edit-profile";

const pill =
  "press flex h-11 shrink-0 items-center rounded-pill border border-line px-[18px] text-sm aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg";

/** "Hi, Alex" above an account page title. */
export function AccountGreeting() {
  const { data: session } = useSession();
  // The session is only known in the browser; wait for hydration so the
  // first client render matches the server's.
  const hydrated = useHydrated();
  const firstName = hydrated ? session?.user?.name?.split(" ")[0] : undefined;
  if (!firstName) return null;
  return <span className="text-sm text-muted">Hi, {firstName}</span>;
}

/** Orders · Wishlist · Edit profile · Log out. Tab changes never animate. */
export function AccountNav({ current }: { current: "orders" | "wishlist" }) {
  const { signOut } = useAuthMutation();

  return (
    <nav
      aria-label="Account"
      className="-mx-4 flex gap-1.5 overflow-x-auto border-t border-line px-4 pt-4 [scrollbar-width:none] lg:mx-0 lg:px-0"
    >
      <Link
        href="/orders"
        aria-current={current === "orders" ? "page" : undefined}
        className={pill}
      >
        Orders
      </Link>
      <Link
        href="/wishlist"
        aria-current={current === "wishlist" ? "page" : undefined}
        className={pill}
      >
        Wishlist
      </Link>
      <button
        type="button"
        onClick={(event) =>
          window.dispatchEvent(
            new CustomEvent(EDIT_PROFILE_EVENT, { detail: event.currentTarget }),
          )
        }
        className={pill}
      >
        Edit profile
      </button>
      <button
        type="button"
        onClick={() => signOut.mutate()}
        className={cn(pill)}
      >
        Log out
      </button>
    </nav>
  );
}
