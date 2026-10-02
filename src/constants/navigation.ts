import type { ProductCategory } from "@/lib/db/drizzle/schema";

export type ShopSection = {
  key: ProductCategory | "new-in";
  label: string;
  href: string;
};

/** Store sections in navigation order. "New in" is the whole catalogue. */
export const shopSections: ShopSection[] = [
  { key: "new-in", label: "New in", href: "/new-in" },
  { key: "t-shirts", label: "T-shirts", href: "/t-shirts" },
  { key: "pants", label: "Trousers", href: "/pants" },
  { key: "sweatshirts", label: "Sweatshirts", href: "/sweatshirts" },
];

export const helpLinks = [
  { label: "Size guide", href: "/help/size-guide" },
  { label: "Delivery", href: "/help/delivery" },
  { label: "Returns", href: "/help/returns" },
];
