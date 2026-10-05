"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { Suspense, type ComponentProps } from "react";

type NavLinkProps = ComponentProps<typeof Link> & { href: string };

const isCurrent = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

function CurrentAwareLink(props: NavLinkProps) {
  const pathname = usePathname();
  return (
    <Link
      prefetch="auto"
      {...props}
      aria-current={isCurrent(pathname, props.href) ? "page" : undefined}
    />
  );
}

/**
 * A nav link that marks itself aria-current. The pathname is request data,
 * so the prerendered shell carries the plain link and the marked one
 * streams in behind it. The sections of the navigation are always on show
 * and are where most visits go next, so their pages are fetched ahead as
 * soon as they render, not on intent like the rest of the store's links.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<Link prefetch="auto" {...props} />}>
      <CurrentAwareLink {...props} />
    </Suspense>
  );
}
