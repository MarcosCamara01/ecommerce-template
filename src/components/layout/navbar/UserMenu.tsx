"use client";

/** COMPONENTS */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  HeartIcon,
  LogoutIcon,
  OrdersIcon,
  UserIcon,
} from "@/components/icons";
import { ThemeIcon } from "@/components/theme/ThemeToggle";
import { ThemeSwitchTrack } from "./ThemeSwitch";
/** FUNCTIONALITY */
import { useSession } from "@/lib/auth/client";
import { useAuthMutation } from "@/hooks/auth/useAuthMutation";
import { toggleTheme, useTheme } from "@/components/theme/theme-store";
import { cn } from "@/lib/utils";
import { useRef, type RefObject } from "react";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function UserMenu({
  triggerRef,
  onEditProfile,
  className,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>;
  onEditProfile: () => void;
  className?: string;
}) {
  const { data: session } = useSession();
  const { signOut } = useAuthMutation();
  const theme = useTheme();
  const skipCloseAutoFocusRef = useRef(false);
  const name = session?.user?.name || "Your account";
  const email = session?.user?.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Account"
          className={cn(
            "press grid size-11 place-items-center rounded-pill text-fg hover:bg-card data-[state=open]:bg-fg data-[state=open]:text-bg",
            className,
          )}
        >
          <UserIcon />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        aria-label="My account"
        className="w-[300px] rounded-photo border border-line"
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
            {initialsOf(name)}
          </span>
          <span className="flex min-w-0 flex-col leading-[1.3]">
            <span className="truncate font-semibold">{name}</span>
            {email ? (
              <span className="truncate text-13 text-muted">{email}</span>
            ) : null}
          </span>
        </div>
        <DropdownMenuSeparator className="mt-0" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              skipCloseAutoFocusRef.current = true;
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

          <DropdownMenuItem
            role="menuitemcheckbox"
            aria-checked={theme === "dark"}
            onSelect={(event) => {
              // Stay open so the switch can be seen to flip.
              event.preventDefault();
              toggleTheme();
            }}
            className="min-h-11 rounded-[14px]"
          >
            <ThemeIcon />
            <span className="grow">Dark mode</span>
            <ThemeSwitchTrack size="sm" />
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
