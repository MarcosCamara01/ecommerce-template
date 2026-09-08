CREATE TYPE "app_private"."catalog_sync_action" AS ENUM('upsert', 'archive');--> statement-breakpoint
CREATE TYPE "app_private"."catalog_sync_state" AS ENUM('pending', 'processing', 'retry_wait', 'needs_attention', 'succeeded');--> statement-breakpoint
CREATE TABLE "app_private"."catalog_sync_operations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" bigint NOT NULL,
	"active_product_id" bigint,
	"action" "app_private"."catalog_sync_action" NOT NULL,
	"state" "app_private"."catalog_sync_state" DEFAULT 'pending' NOT NULL,
	"target" jsonb NOT NULL,
	"stripe_result" jsonb,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_detail" text,
	"last_operator_user_id" text,
	"last_operator_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "catalog_sync_active_product_unique" UNIQUE("active_product_id"),
	CONSTRAINT "catalog_sync_attempt_count_check" CHECK ("app_private"."catalog_sync_operations"."attempt_count" >= 0),
	CONSTRAINT "catalog_sync_active_product_check" CHECK ("app_private"."catalog_sync_operations"."active_product_id" is null or "app_private"."catalog_sync_operations"."active_product_id" = "app_private"."catalog_sync_operations"."product_id"),
	CONSTRAINT "catalog_sync_lease_pair_check" CHECK (("app_private"."catalog_sync_operations"."lease_owner" is null) = ("app_private"."catalog_sync_operations"."lease_expires_at" is null)),
	CONSTRAINT "catalog_sync_terminal_check" CHECK (("app_private"."catalog_sync_operations"."state" = 'succeeded') = ("app_private"."catalog_sync_operations"."active_product_id" is null))
);
--> statement-breakpoint
ALTER TABLE "app_private"."catalog_sync_operations" ADD CONSTRAINT "catalog_sync_operations_product_id_products_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "app_private"."products_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."catalog_sync_operations" ADD CONSTRAINT "catalog_sync_operations_active_product_id_products_items_id_fk" FOREIGN KEY ("active_product_id") REFERENCES "app_private"."products_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_catalog_sync_claim" ON "app_private"."catalog_sync_operations" USING btree ("state","next_attempt_at","lease_expires_at");--> statement-breakpoint
CREATE INDEX "idx_catalog_sync_product" ON "app_private"."catalog_sync_operations" USING btree ("product_id","created_at");

GRANT SELECT, INSERT, UPDATE ON app_private.catalog_sync_operations TO app_runtime;
