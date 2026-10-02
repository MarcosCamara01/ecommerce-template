"use client";

import { SearchIcon } from "@/components/icons";

import { openSearch } from "./search-ui";

/** The current query as a pill; tapping it reopens the search modal. */
export function SearchPill({ query }: { query: string }) {
  return (
    <button
      type="button"
      onClick={() => openSearch()}
      className="press flex h-12 w-full min-w-0 items-center gap-2.5 rounded-pill border border-line px-[18px] text-left sm:w-auto sm:min-w-[min(360px,100%)]"
    >
      <SearchIcon />
      <span className={query ? "truncate" : "truncate text-muted"}>
        {query || "Search products…"}
      </span>
    </button>
  );
}
