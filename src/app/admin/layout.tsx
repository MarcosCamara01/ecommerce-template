import Link from "next/link";

export const metadata = {
  title: "Admin | Ecommerce Template",
};

/** Admin context sits below the global store navigation. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin-page="">
      <header className="-mx-4 flex h-16 items-center justify-between border-b border-line bg-bg pl-4 pr-2 lg:-mx-8 lg:px-8">
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
        </span>
      </header>
      {children}
    </div>
  );
}
