"use client";

/** COMPONENTS */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
/** FUNCTIONALITY */
import { useUser } from "@/hooks/useUser";
import { useSignOut } from "@/hooks/useSignOut";
/** TYPES */
import type { Manager } from "@/hooks/useManager";
/** ICONS */
import { FiUser, FiShoppingBag } from "react-icons/fi";
import { RiLogoutBoxLine } from "react-icons/ri";

export function UserMenu({ manager }: { manager: Manager }) {
  const { user, loading } = useUser();
  const { mutate: signOut } = useSignOut();
  const userName = user?.user_metadata?.name?.split(" ")[0] || "Usuario";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-sm px-4 py-2 font-medium transition-colors text-[#A1A1A1] hover:text-[#EDEDED]">
          {loading ? <Skeleton className="w-24 h-9 rounded-md" /> : userName}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <button
              onClick={manager.open}
              className="flex items-center gap-2 w-full cursor-pointer"
            >
              <FiUser size={16} />
              <span>Edit profile</span>
            </button>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/orders"
              className="flex items-center gap-2 cursor-pointer"
            >
              <FiShoppingBag size={16} />
              <span>View orders</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full cursor-pointer"
          >
            <RiLogoutBoxLine size={16} />
            <span>Log out</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
