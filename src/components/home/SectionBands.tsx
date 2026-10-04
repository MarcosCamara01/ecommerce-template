import { getShopSectionSummaries } from "@/lib/catalog/sections";

import { SectionRow } from "./SectionRow";

/** Edge-to-edge section rows in giant type; the hover lives in SectionRow. */
export async function SectionBands() {
  const sections = (await getShopSectionSummaries()).filter(
    (section) => section.key !== "new-in",
  );

  return (
    <nav aria-label="Browse sections" className="-mx-4 flex flex-col border-t border-line lg:-mx-8">
      {sections.map((section) => (
        <SectionRow
          key={section.key}
          href={section.href}
          label={section.label}
          count={section.count}
        />
      ))}
    </nav>
  );
}
