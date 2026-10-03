"use client";

/** COMPONENTS */
import Link from "next/link";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BagDrawer } from "@/components/bag/BagDrawer";
import { SearchDialog } from "@/components/search/SearchDialog";
import { openSearch } from "@/components/search/search-ui";
import { BagLink } from "./BagLink";
import { NavLink } from "./NavLink";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
/** FUNCTIONALITY */
import { useSession } from "@/lib/auth/client";
import { useManager } from "@/hooks/useManager";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { shopSections } from "@/constants/navigation";
import type { ShopSectionSummary } from "@/lib/catalog/sections";
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { EDIT_PROFILE_EVENT } from "@/components/account/AccountNav";

const EditProfile = dynamic(() => import("./EditProfile"), {
  ssr: false,
});

const iconButton =
  "press grid size-11 place-items-center rounded-pill text-fg hover:bg-card";
// Store-only controls step aside on the bag page.
const offBag = "[body:has([data-bag-page])_&]:hidden";


export const Navbar = ({
  sectionSummaries,
  searchCatalog,
}: {
  sectionSummaries: Promise<ShopSectionSummary[]>;
  searchCatalog: Promise<ProductWithVariants[]>;
}) => {
  const { data: session } = useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const editProfileManager = useManager();
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const profileReturnFocusRef = useRef<HTMLElement | null>(null);
  const skipMobileMenuCloseAutoFocusRef = useRef(false);
  const searchAfterMenuCloseRef = useRef(false);

  // Account pages ask for the dialog from their own "Edit profile" pill.
  useEffect(() => {
    const open = (event: Event) => {
      const trigger = (event as CustomEvent<HTMLElement | null>).detail;
      profileReturnFocusRef.current = trigger;
      editProfileManager.open();
    };
    window.addEventListener(EDIT_PROFILE_EVENT, open);
    return () => window.removeEventListener(EDIT_PROFILE_EVENT, open);
  }, [editProfileManager]);

  return (
    <>
      {/* Desktop: floating glass pill. The header itself lets clicks through. */}
      <header className="pointer-events-none sticky top-0 z-40 hidden justify-center px-8 pt-5 lg:flex [body:has([data-error-page])_&]:!hidden [body:has([data-auth-page])_&]:!hidden [body:has([data-admin-page])_&]:!hidden">
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
            <NavLink
              key={section.key}
              href={section.href}
              className="flex h-11 items-center rounded-pill px-4 text-sm hover:bg-card aria-[current=page]:bg-fg aria-[current=page]:text-bg [body:has([data-bag-page])_&]:hidden"
            >
              {section.label}
            </NavLink>
          ))}
          {/* The bag page trades the store links for a way back. */}
          <Link
            href="/new-in"
            className="hidden h-11 items-center rounded-pill px-4 text-sm hover:bg-card [body:has([data-bag-page])_&]:flex"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            aria-label="Search"
            aria-keyshortcuts="Meta+K /"
            onClick={() => openSearch()}
            className={cn(
              iconButton,
              offBag,
              // The search page marks itself with data-search-page.
              "[body:has([data-search-page])_&]:bg-fg [body:has([data-search-page])_&]:text-bg",
            )}
          >
            <SearchIcon />
          </button>
          <NavLink
            href="/wishlist"
            aria-label="Wishlist"
            className={cn(iconButton, offBag, "aria-[current=page]:bg-fg aria-[current=page]:text-bg")}
          >
            <HeartIcon />
          </NavLink>
          {session?.user ? (
            <UserMenu
              triggerRef={accountTriggerRef}
              onEditProfile={() => {
                profileReturnFocusRef.current = accountTriggerRef.current;
                editProfileManager.open();
              }}
              // Account pages mark themselves with data-account-page.
              className={cn(
                offBag,
                "[body:has([data-account-page])_&]:bg-fg [body:has([data-account-page])_&]:text-bg",
              )}
            />
          ) : (
            <Link
              href="/login"
              aria-label="Account"
              className={cn(iconButton, offBag)}
            >
              <UserIcon />
            </Link>
          )}
          <ThemeToggle />
          <BagLink opensDrawer className="h-11 px-[18px] text-sm" />
        </nav>
      </header>

      {/* Phones and tablets: a plain bar and a full-screen menu sheet. */}
      {/* The product page carries its own controls over the gallery. */}
      <header className="flex h-14 items-center justify-between pl-4 pr-2 lg:hidden [body:has([data-error-page])_&]:hidden [body:has([data-admin-page])_&]:hidden [body:has([data-bag-page])_&]:hidden [body:has([data-auth-page])_&]:hidden [body:has([data-product-page])_&]:hidden">
        <Link
          href="/"
          className="font-display text-[26px] font-extrabold leading-none"
        >
          Store
        </Link>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Search"
            aria-keyshortcuts="Meta+K /"
            onClick={() => openSearch()}
            className={iconButton}
          >
            <SearchIcon />
          </button>
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
              onSearch={() => {
                searchAfterMenuCloseRef.current = true;
              }}
              onCloseAutoFocus={(event) => {
                if (searchAfterMenuCloseRef.current) {
                  event.preventDefault();
                  searchAfterMenuCloseRef.current = false;
                  queueMicrotask(() => openSearch());
                  return;
                }
                if (!skipMobileMenuCloseAutoFocusRef.current) return;
                event.preventDefault();
                skipMobileMenuCloseAutoFocusRef.current = false;
                queueMicrotask(editProfileManager.open);
              }}
            />
          </Sheet>
        </div>
      </header>

      <BagDrawer />
      <SearchDialog catalog={searchCatalog} />

      <EditProfile
        manager={editProfileManager}
        returnFocusRef={profileReturnFocusRef}
      />
    </>
  );
};
