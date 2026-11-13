"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "@/components/ui/link";
import {
  HeartIcon,
  LogoutIcon,
  OrdersIcon,
  UserIcon,
} from "@/components/icons";
import { useSession } from "@/lib/auth/client";
import { useAuthMutation } from "@/hooks/auth/useAuthMutation";
import { cn } from "@/lib/utils";
import { useRef, useState, type RefObject } from "react";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => Array.from(part).find((char) => /\p{L}/u.test(char)))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function UserMenu({
  triggerRef,
  onEditProfile,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>;
  onEditProfile: () => void;
}) {
  const { data: session } = useSession();
  const { signOut } = useAuthMutation();
  const skipCloseAutoFocusRef = useRef(false);
  // Edit profile takes over as the menu closes, so the menu leaves at once.
  const [handingOff, setHandingOff] = useState(false);
  const name = session?.user?.name || "Your account";
  const email = session?.user?.email;
  const initials = initialsOf(name);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setHandingOff(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Account"
          className="press grid size-11 place-items-center rounded-pill text-fg hover:bg-card data-[state=open]:bg-fg data-[state=open]:text-bg"
        >
          <UserIcon />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        aria-label="My account"
        className={cn(
          "w-[300px] rounded-photo border border-line",
          handingOff && "data-[state=closed]:!animate-none",
        )}
        onCloseAutoFocus={(event) => {
          if (!skipCloseAutoFocusRef.current) return;
          event.preventDefault();
          skipCloseAutoFocusRef.current = false;
          queueMicrotask(onEditProfile);
        }}
      >
        <div className="flex items-center gap-3 px-3 pb-3.5 pt-2.5">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-pill bg-fg font-semibold text-bg"
          >
            {initials || <UserIcon />}
          </span>
          <span className="flex min-w-0 flex-col leading-[1.3]">
            <span title={name} className="truncate font-semibold">
              {name}
            </span>
            {email ? (
              <span title={email} className="truncate text-13 text-muted">
                {email}
              </span>
            ) : null}
          </span>
        </div>
        <DropdownMenuSeparator className="mt-0" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              skipCloseAutoFocusRef.current = true;
              setHandingOff(true);
            }}
            className="min-h-11 rounded-[14px]"
          >
            <UserIcon />
            <span>Edit profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="min-h-11 rounded-[14px]">
            <Link href="/orders">
              <OrdersIcon />
              <span>View orders</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="min-h-11 rounded-[14px]">
            <Link href="/wishlist">
              <HeartIcon />
              <span>Wishlist</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut.mutate()}
          className="min-h-11 rounded-[14px]"
        >
          <LogoutIcon />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
