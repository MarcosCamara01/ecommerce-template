import {
  index,
  jsonb,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { appPrivate } from "./namespace";
import { users } from "./users";

export type CheckoutIntentItem = {
  cartItemId: number;
  variantId: number;
  size: string;
  quantity: number;
  priceId: string;
  unitAmount: number;
  currency: string;
  productName?: string;
  variantColor?: string;
  imageUrl?: string;
};

export const checkoutIntents = appPrivate.table(
  "checkout_intents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    checkoutSessionId: text("checkout_session_id"),
    items: jsonb("items").notNull().$type<CheckoutIntentItem[]>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("checkout_intent_session_unique").on(table.checkoutSessionId),
    index("idx_checkout_intent_user").on(table.userId),
    index("idx_checkout_intent_expires").on(table.expiresAt),
  ],
);

export type CheckoutIntent = typeof checkoutIntents.$inferSelect;
