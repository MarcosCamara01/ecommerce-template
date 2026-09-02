CREATE TABLE "app_private"."fulfillment_replay_audit" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" text NOT NULL,
	"prior_state" text NOT NULL,
	"operator_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fulfillment_replay_audit_target_kind_check" CHECK ("app_private"."fulfillment_replay_audit"."target_kind" in ('work', 'effect')),
	CONSTRAINT "fulfillment_replay_audit_prior_state_check" CHECK ("app_private"."fulfillment_replay_audit"."prior_state" = 'needs_attention'),
	CONSTRAINT "fulfillment_replay_audit_reason_check" CHECK (char_length(btrim("app_private"."fulfillment_replay_audit"."reason")) between 1 and 500)
);
--> statement-breakpoint
CREATE TABLE "app_private"."historical_order_price_evidence" (
	"order_product_id" bigint PRIMARY KEY NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_line_item_id" text NOT NULL,
	"unit_amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "historical_price_stripe_line_item_unique" UNIQUE("stripe_line_item_id"),
	CONSTRAINT "historical_price_unit_amount_nonnegative" CHECK ("app_private"."historical_order_price_evidence"."unit_amount" >= 0),
	CONSTRAINT "historical_price_currency_length" CHECK (char_length("app_private"."historical_order_price_evidence"."currency") = 3)
);
--> statement-breakpoint
ALTER TABLE "app_private"."historical_order_price_evidence" ADD CONSTRAINT "historical_order_price_evidence_order_product_id_order_products_id_fk" FOREIGN KEY ("order_product_id") REFERENCES "app_private"."order_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fulfillment_replay_audit_target" ON "app_private"."fulfillment_replay_audit" USING btree ("target_kind","target_id","created_at");