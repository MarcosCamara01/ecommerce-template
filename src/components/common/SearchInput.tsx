import React, { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const SearchInput = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleChange = useCallback((term: string) => {
    if (term) {
      router.replace(`/search?q=${encodeURIComponent(term)}`);
    } else {
      router.replace("/search");
    }
  }, []);

  return (
    <div className="flex w-full border border-[#2E2E2E] rounded-md overflow-hidden">
      <span className="h-[40px] w-[40px] px-3 flex items-center justify-center">
        <svg
          data-testid="geist-icon"
          height="16"
          strokeLinejoin="round"
          viewBox="0 0 16 16"
          width="16"
          style={{ color: "currentcolor" }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0Z"
            fill="currentColor"
          ></path>
        </svg>
      </span>
      <input
        placeholder="Search Products..."
        aria-label="Search"
        className="w-full h-[40px] px-3 bg-[#0A0A0A] text-sm focus:outline-none"
        type="search"
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
