import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons";
import { getShopSectionSummaries } from "@/lib/catalog/sections";

/**
 * Edge-to-edge section rows in giant type. Pointing at a row (or focusing
 * it) washes it with 8% ink and fills its arrow: colour only, 150ms. The
 * hover is limited to pointers that can hover, so it never sticks after a
 * tap.
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
          className="group flex items-center justify-between gap-4 border-b border-line px-4 py-2 transition-[background-color] duration-150 ease-out focus-visible:bg-card lg:px-8 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-card"
        >
          <span className="font-display text-[min(190px,13.2vw)] leading-[0.92]">
            {section.label}
          </span>
          <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm lg:gap-4 lg:text-[15px]">
            {String(section.count).padStart(2, "0")} styles
            <span className="grid size-11 place-items-center rounded-pill border border-fg transition-[background-color,color] duration-150 ease-out group-focus-visible:bg-fg group-focus-visible:text-bg lg:size-16 [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-fg [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-bg">
              <ArrowUpRightIcon />
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
