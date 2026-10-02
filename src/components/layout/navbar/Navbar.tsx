"use client";

/** COMPONENTS */
import Link from "next/link";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BagLink } from "./BagLink";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
/** FUNCTIONALITY */
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { useManager } from "@/hooks/useManager";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { shopSections } from "@/constants/navigation";
import type { ShopSectionSummary } from "@/lib/catalog/sections";
import { cn } from "@/lib/utils";

const EditProfile = dynamic(() => import("./EditProfile"), {
  ssr: false,
});

const iconButton =
  "press grid size-11 place-items-center rounded-pill text-fg hover:bg-card";

const isCurrent = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const Navbar = ({
  sectionSummaries,
}: {
  sectionSummaries: Promise<ShopSectionSummary[]>;
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const editProfileManager = useManager();
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const profileReturnFocusRef = useRef<HTMLElement | null>(null);
  const skipMobileMenuCloseAutoFocusRef = useRef(false);

  return (
    <>
      {/* Desktop: floating glass pill. The header itself lets clicks through. */}
      <header className="pointer-events-none sticky top-0 z-40 hidden justify-center px-8 pt-5 lg:flex">
        <nav
          aria-label="Main"
          className="pointer-events-auto flex items-center gap-2 rounded-pill bg-glass p-1.5 shadow-float backdrop-blur-[20px] transition-[background-color] duration-600 ease-out"
        >
          <Link
            href="/"
            className="px-[18px] font-display text-[26px] font-extrabold leading-[44px]"
          >
            Store
          </Link>
          {shopSections.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              aria-current={isCurrent(pathname, section.href) ? "page" : undefined}
              className="flex h-11 items-center rounded-pill px-4 text-sm hover:bg-card aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {section.label}
            </Link>
          ))}
          <Link href="/search" aria-label="Search" className={iconButton}>
            <SearchIcon />
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            aria-current={isCurrent(pathname, "/wishlist") ? "page" : undefined}
            className={cn(iconButton, "aria-[current=page]:bg-fg aria-[current=page]:text-bg")}
          >
            <HeartIcon />
          </Link>
          {session?.user ? (
            <UserMenu
              triggerRef={accountTriggerRef}
              onEditProfile={() => {
                profileReturnFocusRef.current = accountTriggerRef.current;
                editProfileManager.open();
              }}
              className={cn(
                isCurrent(pathname, "/orders") && "bg-fg text-bg hover:bg-fg",
              )}
            />
          ) : (
            <Link
              href="/login"
              aria-label="Account"
              className={iconButton}
            >
              <UserIcon />
            </Link>
          )}
          <ThemeToggle />
          <BagLink className="h-11 px-[18px] text-sm" />
        </nav>
      </header>

      {/* Phones and tablets: a plain bar and a full-screen menu sheet. */}
      <header className="flex h-14 items-center justify-between pl-4 pr-2 lg:hidden">
        <Link
          href="/"
          className="font-display text-[26px] font-extrabold leading-none"
        >
          Store
        </Link>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Link href="/search" aria-label="Search" className={iconButton}>
            <SearchIcon />
          </Link>
          <BagLink className="mx-1 h-10 px-3.5 text-13" />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                ref={mobileMenuTriggerRef}
                type="button"
                aria-label="Open navigation menu"
                className={iconButton}
              >
                <MenuIcon />
              </button>
            </SheetTrigger>
            <MobileMenu
              sectionSummaries={sectionSummaries}
              onEditProfile={() => {
                skipMobileMenuCloseAutoFocusRef.current = true;
                profileReturnFocusRef.current = mobileMenuTriggerRef.current;
              }}
              onCloseAutoFocus={(event) => {
                if (!skipMobileMenuCloseAutoFocusRef.current) return;
                event.preventDefault();
                skipMobileMenuCloseAutoFocusRef.current = false;
                queueMicrotask(editProfileManager.open);
              }}
            />
          </Sheet>
        </div>
      </header>

      <EditProfile
        manager={editProfileManager}
        returnFocusRef={profileReturnFocusRef}
      />
    </>
  );
};
