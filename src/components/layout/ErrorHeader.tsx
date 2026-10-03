import Link from "next/link";

import { SearchIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * The reduced bar that error and purchase-result pages use in place of the
 * full navigation. The result page drops search as well.
 */
export function ErrorHeader({ search = true }: { search?: boolean }) {
  return (
    <header className="-mr-3 flex h-14 items-center justify-between lg:mr-0 lg:h-[88px]">
      <Link href="/" className="font-display text-[26px] font-extrabold leading-none">
        Store
      </Link>
      <div className="flex items-center gap-1">
        {search ? (
          <Link
            href="/search"
            aria-label="Search"
            className="press grid size-11 place-items-center rounded-pill"
          >
            <SearchIcon />
          </Link>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
