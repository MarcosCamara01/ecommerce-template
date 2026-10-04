"use client";

import { displayName } from "@/utils/product-name";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useEffect, useId, useState } from "react";

import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { shopSections } from "@/constants/navigation";
import { swatchBackground } from "@/constants/colors";
import { useFocusReturn } from "@/hooks/useFocusReturn";
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { formatPriceFromEuros } from "@/utils/formatters";
import { searchProducts } from "@/utils/search";

import {
  openSearch,
  rememberSearch,
  setSearchOpen,
  useRecentSearches,
  useSearchUi,
} from "./search-ui";

const MAX_RESULTS = 6;

const heading = "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

const productHref = (product: ProductWithVariants) => {
  const color = product.variants[0]?.color;
  return color
    ? `/${product.category}/${product.id}?variant=${encodeURIComponent(color)}`
    : `/${product.category}/${product.id}`;
};

const categoryLabel = (category: string) =>
  shopSections.find((section) => section.key === category)?.label ?? category;

/** Underlines the part of the name that matched the query. */
function Highlight({ text, query }: { text: string; query: string }) {
  const at = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (!query.trim() || at < 0) return <>{text}</>;
  const end = at + query.trim().length;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-inherit underline decoration-2 underline-offset-[3px]">
        {text.slice(at, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

const SECTION_TERMS = shopSections.flatMap((section) =>
  section.key === "new-in" ? [] : [section.label],
);

/** Popular terms come from the catalogue: its sections and commonest colours. */
function popularTerms(catalog: ProductWithVariants[]) {
  const counts = new Map<string, number>();
  for (const product of catalog) {
    const color = product.variants[0]?.color;
    if (color) counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  const colours = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([color]) => color);
  return [...SECTION_TERMS, ...colours];
}

/**
 * Search modal. Opened by click it fades and scales in (150ms); opened
 * with ⌘K or "/" it appears at once. Results update as you type without
 * animating; ↑ ↓ move, ↵ opens, Esc closes.
 */
export function SearchDialog({
  catalog,
}: {
  catalog: Promise<ProductWithVariants[]>;
}) {
  const { open, instant } = useSearchUi();
  const focusReturn = useFocusReturn();

  // ⌘K / Ctrl+K anywhere, and "/" when not typing in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) setSearchOpen(false);
        else openSearch(true);
      } else if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        openSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setSearchOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[rgba(17,18,20,0.35)] backdrop-blur-[6px] dark:bg-black/55",
            !instant &&
              "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-150 data-[state=open]:duration-150",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          {...focusReturn}
          className={cn(
            "fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg text-fg shadow-[0_40px_120px_rgba(0,0,0,.35)] outline-none lg:inset-auto lg:left-1/2 lg:top-24 lg:max-h-[calc(100vh-140px)] lg:w-[min(720px,calc(100%-32px))] lg:-translate-x-1/2 lg:rounded-photo-lg",
            !instant &&
              "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] data-[state=closed]:duration-150 data-[state=open]:duration-150 motion-reduce:zoom-in-100 motion-reduce:zoom-out-100",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <Suspense fallback={<SearchPanel catalog={[]} />}>
            <SearchWithCatalog catalog={catalog} />
          </Suspense>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SearchWithCatalog({
  catalog,
}: {
  catalog: Promise<ProductWithVariants[]>;
}) {
  return <SearchPanel catalog={use(catalog)} />;
}

function SearchPanel({ catalog }: { catalog: ProductWithVariants[] }) {
  const router = useRouter();
  const recent = useRecentSearches();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const term = query.trim();
  const matches = term ? searchProducts(catalog, term) : [];
  const results = matches.slice(0, MAX_RESULTS);
  const total = matches.length;
  const popular = popularTerms(catalog);
  const resultsHref = `/search?q=${encodeURIComponent(term)}`;

  const go = (href: string) => {
    rememberSearch(term);
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <>
      <InputGroup variant="search">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label="Search products"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
          placeholder="Search products…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" && results.length > 0) {
              event.preventDefault();
              setActive((index) => (index + 1) % results.length);
            } else if (event.key === "ArrowUp" && results.length > 0) {
              event.preventDefault();
              setActive((index) => (index - 1 + results.length) % results.length);
            } else if (event.key === "Enter" && term) {
              event.preventDefault();
              go(results[active] ? productHref(results[active]) : resultsHref);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <kbd className="hidden rounded-lg border border-line px-2 py-1 font-sans text-xs text-muted lg:block">
            Esc
          </kbd>
          <DialogPrimitive.Close className="grid h-11 place-items-center px-2.5 font-medium lg:hidden">
            Cancel
          </DialogPrimitive.Close>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex flex-col gap-[22px] overflow-y-auto p-5">
        {!term ? (
          <>
            {recent.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <h2 className={heading}>Recent</h2>
                {recent.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="flex min-h-11 items-center gap-3 text-left"
                  >
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 8v4l3 2" />
                    </svg>
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            <PopularTerms terms={popular} onPick={setQuery} />
          </>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <h2 className={heading} aria-live="polite">
              {total} {total === 1 ? "product" : "products"}
            </h2>
            <ul id={listId} role="listbox" aria-label="Products" className="flex flex-col">
              {results.map((product, index) => {
                const color = product.variants[0]?.color;
                return (
                  <li
                    key={product.id}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                  >
                    <Link
                      href={productHref(product)}
                      tabIndex={-1}
                      onClick={() => rememberSearch(term)}
                      onMouseEnter={() => setActive(index)}
                      onNavigate={() => setSearchOpen(false)}
                      className={cn(
                        "-mx-2 grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-field p-2",
                        index === active && "bg-card",
                      )}
                    >
                      <Image
                        src={product.img}
                        alt=""
                        width={56}
                        height={72}
                        sizes="56px"
                        className="h-[72px] w-14 rounded-xl bg-photo object-cover"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          <Highlight text={displayName(product.name)} query={term} />
                        </span>
                        <span className="flex items-center gap-1.5 text-13 text-muted">
                          {color ? (
                            <span
                              aria-hidden="true"
                              className="size-2.5 rounded-pill shadow-[0_0_0_1px_var(--line)]"
                              style={{ background: swatchBackground(color) }}
                            />
                          ) : null}
                          {categoryLabel(product.category)}
                          {color ? ` · ${color}` : ""}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm tabular-nums">
                        {formatPriceFromEuros(product.price)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href={resultsHref}
              onClick={() => rememberSearch(term)}
              onNavigate={() => setSearchOpen(false)}
              className="press mt-1.5 flex min-h-[52px] items-center justify-between rounded-pill bg-fg px-[18px] font-semibold text-bg"
            >
              <span>See all results for “{term}”</span>
              <ArrowRightIcon />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 py-3" aria-live="polite">
            <p className="font-display text-5xl leading-[0.9]">Nothing for “{term}”</p>
            <p className="text-muted">Check the spelling, or try one of these:</p>
            <PopularTerms terms={popular} onPick={setQuery} hideHeading />
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className="hidden gap-[18px] border-t border-line px-5 py-3.5 text-xs text-muted lg:flex"
      >
        <span>↑ ↓ to move</span>
        <span>↵ to open</span>
        <span>Esc to close</span>
      </div>
    </>
  );
}

function PopularTerms({
  terms,
  onPick,
  hideHeading = false,
}: {
  terms: string[];
  onPick: (term: string) => void;
  hideHeading?: boolean;
}) {
  if (terms.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      {hideHeading ? null : <h2 className={heading}>Popular</h2>}
      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onPick(term)}
            className="press h-10 rounded-pill border border-line px-4 text-sm hover:border-fg"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
