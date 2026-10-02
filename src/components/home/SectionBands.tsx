import Image from "next/image";
import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons";
import { getShopSectionSummaries } from "@/lib/catalog/sections";

/**
 * Edge-to-edge section rows in giant type. On a fine pointer the newest
 * photo of the section peeks in, tilted, while the row is hovered.
 */
export async function SectionBands() {
  const sections = (await getShopSectionSummaries()).filter(
    (section) => section.key !== "new-in",
  );

  return (
    <nav aria-label="Browse sections" className="-mx-4 flex flex-col border-t border-line lg:-mx-8">
      {sections.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className="group relative flex items-center justify-between gap-4 overflow-hidden border-b border-line px-4 py-2 lg:px-8"
        >
          <span className="font-display text-[min(190px,13.2vw)] leading-[0.92]">
            {section.label}
          </span>
          {section.image ? (
            <Image
              src={section.image}
              alt=""
              width={150}
              height={200}
              sizes="150px"
              className="pointer-events-none absolute left-[70%] top-1/2 hidden h-[200px] w-[150px] -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-[18px] object-cover opacity-0 shadow-[0_20px_50px_rgba(0,0,0,.25)] transition-opacity duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:block group-hover:opacity-100 group-focus-visible:opacity-100"
            />
          ) : null}
          <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm lg:gap-4 lg:text-[15px]">
            {String(section.count).padStart(2, "0")} styles
            <span className="grid size-11 place-items-center rounded-pill border border-fg lg:size-16">
              <ArrowUpRightIcon />
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
