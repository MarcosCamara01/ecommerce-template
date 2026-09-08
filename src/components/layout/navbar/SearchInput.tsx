"use client";

import { Suspense, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const SearchIcon = (
  <svg
    data-testid="geist-icon"
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    style={{ color: "currentcolor" }}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5ZM6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.02 13 9.43 12.47 10.54 11.6L13.97 15.03L14.5 15.56L15.56 14.5L15.03 13.97L11.6 10.54C12.47 9.43 13 8.02 13 6.5C13 2.91 10.09 0 6.5 0Z"
      fill="currentColor"
    ></path>
  </svg>
);

function SearchInputContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  function handleChange(term: string) {
    startTransition(() => {
      if (term) {
        router.replace(`/search?q=${encodeURIComponent(term)}`);
      } else {
        router.replace("/search");
      }
    });
  }

  return (
    <div className="flex w-full min-w-0 overflow-hidden rounded-md border border-[#2E2E2E] focus-within:ring-2 focus-within:ring-border-primary focus-within:ring-offset-2 focus-within:ring-offset-background-primary">
      <span className="h-[40px] w-[40px] px-3 flex items-center justify-center">
        {SearchIcon}
      </span>
      <input
        name="q"
        autoComplete="off"
        enterKeyHint="search"
        spellCheck={false}
        placeholder={"Search Products\u2026"}
        aria-label="Search"
        className="h-[40px] w-full min-w-0 bg-background-secondary px-3 text-sm text-color-secondary focus-visible:outline-none"
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}

export const SearchInput = () => {
  return (
    <Suspense
      fallback={
        <div className="flex w-full min-w-0 overflow-hidden rounded-md border border-[#2E2E2E]">
          <span className="h-[40px] w-[40px] px-3 flex items-center justify-center">
            {SearchIcon}
          </span>
          <input
            placeholder={"Search Products\u2026"}
            aria-label="Search"
            className="h-[40px] w-full min-w-0 bg-background-secondary px-3 text-sm"
            type="search"
            disabled
          />
        </div>
      }
    >
      <SearchInputContent />
    </Suspense>
  );
};
