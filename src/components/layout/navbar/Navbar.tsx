"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FiMenu, FiPhone, FiUser } from "react-icons/fi";
import { useSession } from "@/lib/auth/client";
import { useManager } from "@/hooks/useManager";
import { SearchInput } from "./SearchInput";
import { UserMenu } from "./UserMenu";
import { WishlistLink } from "./WishlistLink";
import { CartLink } from "./CartLink";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const EditProfile = dynamic(() => import("./EditProfile"), { ssr: false });

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/t-shirts", label: "Herramientas" },
  { href: "/pants", label: "Electricidad" },
  { href: "/sweatshirts", label: "Construcción" },
  { href: "/t-shirts", label: "Ofertas" },
  { href: "/", label: "Marcas" },
  { href: "/", label: "Contacto" },
];

export const Navbar = () => {
  const { data: session, isPending } = useSession();
  const editProfileManager = useManager();

  return (
    <>
      <div className="bg-[#073c55] text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 font-medium">
            <FiPhone size={14} />
            <span>Atención al cliente: +595 981 000 000</span>
          </div>
          <span className="hidden font-medium md:block">Ofertas especiales en herramientas y materiales</span>
          <span className="hidden text-white/80 lg:block">Paraguay · Gs.</span>
        </div>
      </div>

      <header className="pointer-events-auto w-full border-b border-slate-200 bg-white text-slate-900">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center border border-slate-200 lg:hidden" aria-label="Abrir menú">
                <FiMenu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88%] max-w-sm p-0">
              <div className="border-b border-slate-200 px-6 py-5">
                <SheetTitle className="text-xl font-black text-[#073c55]">INCOFER</SheetTitle>
                <p className="mt-1 text-xs text-slate-500">Ferretería & herramientas</p>
              </div>
              <nav className="p-4">
                {navLinks.map((link) => (
                  <SheetClose asChild key={`${link.label}-${link.href}`}>
                    <Link href={link.href} className="block border-b border-slate-100 px-3 py-4 text-sm font-semibold text-slate-700 hover:text-[#d7193f]">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {!session?.user && !isPending && (
                  <SheetClose asChild>
                    <Link href="/login" className="mt-5 flex items-center gap-2 px-3 py-3 text-sm font-semibold text-[#073c55]">
                      <FiUser /> Iniciar sesión
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="shrink-0 leading-none">
            <span className="block text-3xl font-black tracking-[-0.06em] text-[#d7193f]">INCOFER</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#073c55]">Ferretería</span>
          </Link>

          <div className="mx-auto hidden w-full max-w-2xl sm:block">
            <SearchInput />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {!isPending && (
              session?.user ? (
                <UserMenu manager={editProfileManager} />
              ) : (
                <Link href="/login" className="hidden h-10 items-center gap-2 px-3 text-sm font-semibold text-[#073c55] transition hover:text-[#d7193f] lg:flex">
                  <FiUser size={19} />
                  <span>Mi cuenta</span>
                </Link>
              )
            )}
            <WishlistLink />
            <CartLink />
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 pb-4 sm:hidden">
          <SearchInput />
        </div>

        <nav className="hidden border-t border-slate-200 lg:block">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-10 px-10 py-3.5">
            {navLinks.map((link, index) => (
              <Link
                key={`${link.label}-${index}`}
                href={link.href}
                className={`text-sm font-semibold transition hover:text-[#d7193f] ${index === 0 ? "text-[#d7193f]" : "text-slate-700"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <EditProfile manager={editProfileManager} />
    </>
  );
};
