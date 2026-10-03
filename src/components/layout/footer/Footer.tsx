import Link from "next/link";

import { helpLinks } from "@/constants/navigation";

import { FooterAccountLink } from "./FooterAccountLink";

export const Footer = () => {
  return (
    <footer className="[body:has([data-error-page])_&]:hidden [body:has([data-admin-page])_&]:hidden [body:has([data-auth-page])_&]:hidden flex flex-col gap-6 overflow-clip border-t border-line px-4 pb-6 lg:px-8 [body:has([data-fixed-cta])_&]:pb-28 lg:[body:has([data-fixed-cta])_&]:pb-6">
      <div className="flex flex-wrap justify-between gap-4 pt-6 text-sm">
        <nav aria-label="Help" className="flex flex-wrap gap-x-6 gap-y-2">
          {helpLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline hover:underline-offset-[3px]">
              {link.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Account" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/orders" className="hover:underline hover:underline-offset-[3px]">
            Orders
          </Link>
          <Link href="/wishlist" className="hover:underline hover:underline-offset-[3px]">
            Wishlist
          </Link>
          <FooterAccountLink />
          <Link
            href="https://github.com/MarcosCamara01/ecommerce-template"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-fg"
          >
            Source on GitHub
          </Link>
        </nav>
      </div>
      <p
        aria-hidden="true"
        className="select-none text-center font-display text-[min(420px,29vw)] leading-[0.76]"
      >
        Store
      </p>
    </footer>
  );
};
