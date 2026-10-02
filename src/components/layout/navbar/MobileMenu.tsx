"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, use } from "react";

import {
  CloseIcon,
  HeartIcon,
  LogoutIcon,
  OrdersIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { helpLinks, shopSections, type ShopSection } from "@/constants/navigation";
import { useAuthMutation } from "@/hooks/auth/useAuthMutation";
import { useSession } from "@/lib/auth/client";

import type { ShopSectionSummary } from "@/lib/catalog/sections";
import { ThemeSwitch } from "./ThemeSwitch";

const tile =
  "press flex h-12 items-center gap-2.5 rounded-field bg-card px-3.5 text-left text-fg";

/** Full-screen menu sheet for phones (CMenu). */
export function MobileMenu({
  sectionSummaries,
  onCloseAutoFocus,
  onEditProfile,
  onSearch,
}: {
  sectionSummaries: Promise<ShopSectionSummary[]>;
  onCloseAutoFocus: (event: Event) => void;
  /** Runs before the sheet closes; the dialog opens once it has. */
  onEditProfile: () => void;
  /** Same hand-off for the search modal. */
  onSearch: () => void;
}) {
  const { data: session, isPending } = useSession();
  const { signOut } = useAuthMutation();
  const user = session?.user;

  return (
    <SheetContent
      side="top"
      className="h-dvh overflow-y-auto overscroll-contain bg-bg"
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <nav
        aria-label="Menu"
        className="flex min-h-full flex-col gap-[22px] px-4 pb-6"
      >
        <div className="-mr-3 flex h-14 items-center justify-between">
          <SheetClose asChild>
            <Link
              href="/"
              className="font-display text-[26px] font-extrabold leading-none"
            >
              Store
            </Link>
          </SheetClose>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Browse the store, your account and help.
          </SheetDescription>
          <SheetClose
            aria-label="Close menu"
            className="press grid size-11 place-items-center rounded-pill"
          >
            <CloseIcon />
          </SheetClose>
        </div>

        <SheetClose asChild>
          <button
            type="button"
            onClick={onSearch}
            className="flex h-12 items-center gap-2.5 rounded-pill border border-line px-4 text-left"
          >
            <SearchIcon size={16} />
            <span className="text-muted">Search products…</span>
          </button>
        </SheetClose>

        <Suspense fallback={<SectionList sections={shopSections} />}>
          <SectionListWithCounts sectionSummaries={sectionSummaries} />
        </Suspense>

        {isPending ? (
          <div className="grid grid-cols-2 gap-1.5" aria-hidden="true">
            <Skeleton className="h-12 rounded-field" />
            <Skeleton className="h-12 rounded-field" />
          </div>
        ) : user ? (
          <div className="flex flex-col gap-1">
            <span className="text-13 text-muted">
              Signed in as {user.name || user.email}
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <SheetClose asChild>
                <Link href="/orders" className={tile}>
                  <OrdersIcon />
                  <span>Orders</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/wishlist" className={tile}>
                  <HeartIcon />
                  <span>Wishlist</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={onEditProfile}
                  className={tile}
                >
                  <UserIcon />
                  <span>Edit profile</span>
                </button>
              </SheetClose>
              <button
                type="button"
                onClick={() => signOut.mutate()}
                className={tile}
              >
                <LogoutIcon />
                <span>Log out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <SheetClose asChild>
              <Link
                href="/login"
                className="press grid h-[52px] place-items-center rounded-pill bg-fg font-semibold text-bg"
              >
                Sign in
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/register"
                className="press grid h-[52px] place-items-center rounded-pill border border-fg font-medium"
              >
                Create account
              </Link>
            </SheetClose>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap gap-3.5 text-sm">
            {helpLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link href={link.href} className="py-2">
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </div>
          <ThemeSwitch />
        </div>
      </nav>
    </SheetContent>
  );
}

function SectionListWithCounts({
  sectionSummaries,
}: {
  sectionSummaries: Promise<ShopSectionSummary[]>;
}) {
  return <SectionList sections={use(sectionSummaries)} />;
}

function SectionList({
  sections,
}: {
  sections: (ShopSection & Partial<ShopSectionSummary>)[];
}) {
  return (
    <ul className="flex flex-col">
      {sections.map((section) => (
        <li key={section.key} className="border-b border-line">
          <SheetClose asChild>
            <Link
              href={section.href}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="font-display text-[50px] leading-[0.95]">
                {section.label}
              </span>
              <span className="flex items-center gap-2.5 text-sm tabular-nums">
                {section.count !== undefined ? (
                  <span>{String(section.count).padStart(2, "0")}</span>
                ) : null}
                {section.image ? (
                  <Image
                    src={section.image}
                    alt=""
                    width={44}
                    height={56}
                    sizes="44px"
                    className="h-14 w-11 rounded-[10px] bg-photo object-cover"
                  />
                ) : (
                  <span className="h-14 w-11 rounded-[10px] bg-photo" />
                )}
              </span>
            </Link>
          </SheetClose>
        </li>
      ))}
    </ul>
  );
}
