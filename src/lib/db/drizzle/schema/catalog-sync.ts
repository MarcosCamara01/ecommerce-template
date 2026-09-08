import { sql } from "drizzle-orm";
import { bigserial, bigint, check, foreignKey, index, integer, jsonb, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import {
  catalogSyncActions,
  catalogSyncStates,
  type CatalogSyncStripeResult,
  type CatalogSyncTarget,
} from "../../../catalog-sync/model";
import { appPrivate } from "./namespace";
import { productsItems } from "./products";

export const catalogSyncActionEnum = appPrivate.enum("catalog_sync_action", catalogSyncActions);
export const catalogSyncStateEnum = appPrivate.enum("catalog_sync_state", catalogSyncStates);

export const catalogSyncOperations = appPrivate.table(
  "catalog_sync_operations",
  {
    id: uuid("id").primaryKey(),
    productId: bigint("product_id", { mode: "number" }).notNull().references(() => productsItems.id, { onDelete: "restrict" }),
    activeProductId: bigint("active_product_id", { mode: "number" }).references(() => productsItems.id, { onDelete: "restrict" }),
    action: catalogSyncActionEnum("action").notNull(),
    requestHash: text("request_hash"),
    state: catalogSyncStateEnum("state").notNull().default("pending"),
    target: jsonb("target").$type<CatalogSyncTarget>().notNull(),
    stripeResult: jsonb("stripe_result").$type<CatalogSyncStripeResult>(),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    lastErrorDetail: text("last_error_detail"),
    lastOperatorUserId: text("last_operator_user_id"),
    lastOperatorReason: text("last_operator_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("catalog_sync_active_product_unique").on(table.activeProductId),
    index("idx_catalog_sync_claim").on(table.state, table.nextAttemptAt, table.leaseExpiresAt),
    index("idx_catalog_sync_product").on(table.productId, table.createdAt),
    check("catalog_sync_attempt_count_check", sql`${table.attemptCount} >= 0`),
    check("catalog_sync_active_product_check", sql`${table.activeProductId} is null or ${table.activeProductId} = ${table.productId}`),
    check("catalog_sync_lease_pair_check", sql`(${table.leaseOwner} is null) = (${table.leaseExpiresAt} is null)`),
    check("catalog_sync_terminal_check", sql`(${table.state}::text in ('succeeded', 'cancelled')) = (${table.activeProductId} is null)`),
  ],
);

export const catalogSyncReplayAudit = appPrivate.table(
  "catalog_sync_replay_audit",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    operationId: uuid("operation_id").notNull(),
    priorState: text("prior_state").notNull(),
    priorErrorCode: text("prior_error_code"),
    priorErrorDetail: text("prior_error_detail"),
    operatorUserId: text("operator_user_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.operationId],
      foreignColumns: [catalogSyncOperations.id],
      name: "catalog_sync_replay_operation_fk",
    }).onDelete("restrict"),
    index("idx_catalog_sync_replay_operation").on(table.operationId, table.createdAt),
    check("catalog_sync_replay_prior_state_check", sql`${table.priorState} = 'needs_attention'`),
    check("catalog_sync_replay_reason_check", sql`char_length(btrim(${table.reason})) between 1 and 500`),
  ],
);

export type CatalogSyncOperation = typeof catalogSyncOperations.$inferSelect;
export type CatalogSyncReplayAudit = typeof catalogSyncReplayAudit.$inferSelect;
