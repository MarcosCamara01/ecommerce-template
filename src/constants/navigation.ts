import type { ProductCategory } from "@/lib/db/drizzle/schema";

export type ShopSection = {
  key: ProductCategory | "new-in";
  label: string;
  href: string;
};

/** Store sections in navigation order. "New arrivals" is the whole catalogue. */
export const shopSections: ShopSection[] = [
  { key: "new-in", label: "New arrivals", href: "/new-in" },
  { key: "t-shirts", label: "T-shirts", href: "/t-shirts" },
  { key: "pants", label: "Pants", href: "/pants" },
  { key: "sweatshirts", label: "Sweatshirts", href: "/sweatshirts" },
];

export const helpLinks = [
  { label: "Size guide", href: "/help/size-guide" },
  { label: "Delivery", href: "/help/delivery" },
  { label: "Returns", href: "/help/returns" },
];
