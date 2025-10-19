"use client";

/** COMPONENTS */
import Link from "next/link";
import { LinksDesktop } from "../LinksDesktop";
import { UserMenu } from "../UserMenu";
import SearchInput from "../SearchInput";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { WishlistButton } from "./WishlistButton";
import { CartButton } from "./CartButton";
import { Separator } from "@/components/ui/separator";
/** FUNCTIONALITY */
import { useUser } from "@/hooks/useUser";
import { useManager } from "@/hooks/useManager";
import dynamic from "next/dynamic";
import { useSignOut } from "@/hooks/useSignOut";
/** ICONS */
import { FiUser, FiMenu, FiCreditCard } from "react-icons/fi";
import { RiLogoutBoxLine } from "react-icons/ri";

const EditProfile = dynamic(() => import("../EditProfile"), {
  ssr: false,
});

export const Navbar = () => {
  const { user } = useUser();

  const editProfileManager = useManager();
  const { mutate: signOut } = useSignOut();

  const linksData = [
    { path: "/t-shirts", name: "T-SHIRTS" },
    { path: "/pants", name: "PANTS" },
    { path: "/sweatshirts", name: "SWEATSHIRTS" },
  ];

  return (
    <>
      <header className="pointer-events-auto w-full px-3.5 gap-4 xs:px-6 sm:px-12 py-6 flex items-center justify-between bg-background-secondary border-b border-solid border-border-primary">
        {/* Mobile Menu Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex px-4 py-2 lg:hidden hover:opacity-75 transition-opacity">
              <FiMenu size={24} />
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="w-full sm:w-80 p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border-primary">
                <h2 className="text-lg font-semibold">Menu</h2>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto">
                <ul className="flex flex-col gap-2 p-4">
                  {/* Category Links */}
                  {linksData.map((link, index) => (
                    <li key={index}>
                      <SheetClose asChild>
                        <Link
                          href={link.path}
                          className="flex items-center px-4 py-2 rounded-md hover:bg-color-secondary transition-colors text-sm font-medium"
                        >
                          {link.name}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}

                  {/* Separator */}
                  {user && <Separator className="my-2" />}

                  {/* User Links */}
                  {user && (
                    <>
                      <li>
                        <SheetClose asChild>
                          <Link
                            href="/orders"
                            className="flex items-center px-4 py-2 rounded-md hover:bg-color-secondary transition-colors text-sm font-medium"
                          >
                            <FiCreditCard className="mr-2" size={16} />
                            <span>View orders</span>
                          </Link>
                        </SheetClose>
                      </li>

                      <li>
                        <SheetClose asChild>
                          <button
                            onClick={editProfileManager.open}
                            className="flex items-center w-full px-4 py-2 rounded-md hover:bg-color-secondary transition-colors text-sm font-medium"
                          >
                            <FiUser className="mr-2" size={16} />
                            <span>Edit profile</span>
                          </button>
                        </SheetClose>
                      </li>

                      <li>
                        <Separator className="my-2" />
                      </li>

                      <li>
                        <button
                          onClick={() => signOut()}
                          className="flex gap-2 items-center w-full px-4 py-2 rounded-md hover:bg-color-secondary transition-colors text-sm font-medium"
                        >
                          <RiLogoutBoxLine size={16} />
                          <span>Log out</span>
                        </button>
                      </li>
                    </>
                  )}

                  {/* Login Link for non-authenticated users */}
                  {!user && (
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/login"
                          className="flex items-center px-4 py-2 rounded-md hover:bg-color-secondary transition-colors text-sm font-medium"
                        >
                          Login
                        </Link>
                      </SheetClose>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <ul className="justify-between hidden gap-2 text-sm lg:flex">
          {user ? (
            <li className="items-center justify-center hidden lg:flex">
              <UserMenu manager={editProfileManager} />
            </li>
          ) : (
            <li className="flex items-center justify-center">
              <Link
                href="/login"
                className="text-sm px-4 py-2 transition-all lg:text-border-secondary hover:text-white font-medium"
              >
                Login
              </Link>
            </li>
          )}
          <li>
            <LinksDesktop />
          </li>
        </ul>

        {/* Search Input */}
        <SearchInput />

        {/* Cart and Wishlist Buttons */}
        <ul className="flex gap-2">
          <li className="flex items-center justify-center">
            <CartButton />
          </li>
          <li className="flex items-center justify-center">
            <WishlistButton />
          </li>
        </ul>
      </header>

      <EditProfile manager={editProfileManager} />
    </>
  );
};
