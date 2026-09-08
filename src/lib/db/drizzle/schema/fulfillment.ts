import { sql } from "drizzle-orm";
import {
  bigserial,
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { appPrivate } from "./namespace";
import { orderItems } from "./orders";

export const fulfillmentStateEnum = appPrivate.enum("fulfillment_state", [
  "pending",
  "processing",
  "succeeded",
  "needs_attention",
]);

export const fulfillmentEffectKindEnum = appPrivate.enum(
  "fulfillment_effect_kind",
  ["order_email", "cart_cleanup"],
);

export const fulfillmentEffectStateEnum = appPrivate.enum(
  "fulfillment_effect_state",
  ["pending", "processing", "succeeded", "needs_attention"],
);

export const stripeEventReceipts = appPrivate.table(
  "stripe_event_receipts",
  {
    eventId: text("event_id").primaryKey(),
    eventType: text("event_type").notNull(),
    objectId: text("object_id"),
    stripeCreatedAt: timestamp("stripe_created_at", { withTimezone: true })
      .notNull(),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_stripe_event_type").on(table.eventType),
    index("idx_stripe_event_object_id").on(table.objectId),
  ],
);

export const fulfillmentWork = appPrivate.table(
  "fulfillment_work",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    checkoutSessionId: text("checkout_session_id").notNull(),
    sourceEventId: text("source_event_id"),
    paymentConfirmedAt: timestamp("payment_confirmed_at", {
      withTimezone: true,
    }),
    paymentConfirmationEventId: text("payment_confirmation_event_id"),
    state: fulfillmentStateEnum("state").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    lastErrorDetail: text("last_error_detail"),
    orderId: bigint("order_id", { mode: "number" }).references(
      () => orderItems.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.sourceEventId],
      foreignColumns: [stripeEventReceipts.eventId],
      name: "fulfillment_work_source_event_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.paymentConfirmationEventId],
      foreignColumns: [stripeEventReceipts.eventId],
      name: "fulfillment_work_payment_confirmation_event_fk",
    }).onDelete("restrict"),
    unique("fulfillment_work_checkout_session_unique").on(
      table.checkoutSessionId,
    ),
    unique("fulfillment_work_order_unique").on(table.orderId),
    index("idx_fulfillment_work_claim").on(
      table.state,
      table.nextAttemptAt,
      table.leaseExpiresAt,
    ),
  ],
);

export const fulfillmentEffects = appPrivate.table(
  "fulfillment_effects",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    workId: bigint("work_id", { mode: "number" })
      .notNull()
      .references(() => fulfillmentWork.id, { onDelete: "cascade" }),
    kind: fulfillmentEffectKindEnum("kind").notNull(),
    state: fulfillmentEffectStateEnum("state").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    lastErrorDetail: text("last_error_detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("fulfillment_effect_idempotency_unique").on(table.idempotencyKey),
    index("idx_fulfillment_effect_claim").on(
      table.state,
      table.nextAttemptAt,
      table.leaseExpiresAt,
    ),
    index("idx_fulfillment_effect_work").on(table.workId),
  ],
);

export const fulfillmentReplayAudit = appPrivate.table(
  "fulfillment_replay_audit",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    targetKind: text("target_kind").notNull(),
    targetId: text("target_id").notNull(),
    priorState: text("prior_state").notNull(),
    operatorUserId: text("operator_user_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "fulfillment_replay_audit_target_kind_check",
      sql`${table.targetKind} in ('work', 'effect')`,
    ),
    check(
      "fulfillment_replay_audit_prior_state_check",
      sql`${table.priorState} = 'needs_attention'`,
    ),
    check(
      "fulfillment_replay_audit_reason_check",
      sql`char_length(btrim(${table.reason})) between 1 and 500`,
    ),
    index("idx_fulfillment_replay_audit_target").on(
      table.targetKind,
      table.targetId,
      table.createdAt,
    ),
  ],
);

export type FulfillmentWorkRow = typeof fulfillmentWork.$inferSelect;
export type FulfillmentEffectRow = typeof fulfillmentEffects.$inferSelect;
export type FulfillmentReplayAuditRow = typeof fulfillmentReplayAudit.$inferSelect;
