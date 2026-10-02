import Link from "next/link";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Admin pages get their own bar instead of the store navigation. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin-page="">
      <header className="sticky top-0 z-40 -mx-4 flex h-16 items-center justify-between border-b border-line bg-bg pl-4 pr-2 lg:-mx-8 lg:px-8">
        <span className="flex items-baseline gap-2">
          <Link href="/" className="font-display text-[26px] font-extrabold leading-none">
            Store
          </Link>
          <span className="text-sm text-muted">Admin</span>
        </span>
        <span className="flex items-center gap-1">
          <Link
            href="/"
            className="press flex h-10 items-center rounded-pill border border-line px-3.5 text-sm"
          >
            View store
          </Link>
          <ThemeToggle />
        </span>
      </header>
      {children}
    </div>
  );
}
