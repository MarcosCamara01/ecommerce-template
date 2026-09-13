CREATE TYPE "app_private"."fulfillment_effect_kind" AS ENUM('order_email', 'cart_cleanup');--> statement-breakpoint
CREATE TYPE "app_private"."fulfillment_effect_state" AS ENUM('pending', 'processing', 'succeeded', 'needs_attention');--> statement-breakpoint
CREATE TYPE "app_private"."fulfillment_state" AS ENUM('pending', 'processing', 'succeeded', 'needs_attention');--> statement-breakpoint
CREATE TYPE "app_private"."product_category" AS ENUM('t-shirts', 'pants', 'sweatshirts');--> statement-breakpoint
CREATE TYPE "app_private"."sizes" AS ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL');--> statement-breakpoint
CREATE TABLE "app_private"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_private"."cart_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"variant_id" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"size" "app_private"."sizes" NOT NULL,
	"stripe_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cart_user_variant_size_unique" UNIQUE("user_id","variant_id","size"),
	CONSTRAINT "quantity_positive" CHECK (quantity > 0)
);
--> statement-breakpoint
CREATE TABLE "app_private"."customer_info" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" jsonb NOT NULL,
	"stripe_order_id" text NOT NULL,
	"total_price" bigint NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customer_info_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "customer_info_stripe_order_id_unique" UNIQUE("stripe_order_id")
);
--> statement-breakpoint
CREATE TABLE "app_private"."fulfillment_effects" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"work_id" bigint NOT NULL,
	"kind" "app_private"."fulfillment_effect_kind" NOT NULL,
	"state" "app_private"."fulfillment_effect_state" DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fulfillment_effect_idempotency_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "app_private"."fulfillment_work" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"checkout_session_id" text NOT NULL,
	"source_event_id" text,
	"state" "app_private"."fulfillment_state" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_detail" text,
	"order_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fulfillment_work_checkout_session_unique" UNIQUE("checkout_session_id"),
	CONSTRAINT "fulfillment_work_order_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "app_private"."order_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"delivery_date" timestamp with time zone NOT NULL,
	"order_number" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "order_items_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "app_private"."order_products" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"variant_id" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"size" text NOT NULL,
	"unit_amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "order_quantity_positive" CHECK (quantity > 0),
	CONSTRAINT "order_unit_amount_nonnegative" CHECK (unit_amount >= 0)
);
--> statement-breakpoint
CREATE TABLE "app_private"."products_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category" "app_private"."product_category" NOT NULL,
	"img" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "price_positive" CHECK (price > 0)
);
--> statement-breakpoint
CREATE TABLE "app_private"."products_variants" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" bigint NOT NULL,
	"stripe_id" varchar(255) NOT NULL,
	"color" varchar(100) NOT NULL,
	"sizes" "app_private"."sizes"[] NOT NULL,
	"images" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_variants_stripe_id_unique" UNIQUE("stripe_id"),
	CONSTRAINT "product_color_unique" UNIQUE("product_id","color")
);
--> statement-breakpoint
CREATE TABLE "app_private"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "app_private"."stripe_event_receipts" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"object_id" text,
	"stripe_created_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_private"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "app_private"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_private"."wishlist" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "wishlist_user_product_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "app_private"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_private"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "app_private"."products_variants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."customer_info" ADD CONSTRAINT "customer_info_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_private"."order_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_effects" ADD CONSTRAINT "fulfillment_effects_work_id_fulfillment_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "app_private"."fulfillment_work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" ADD CONSTRAINT "fulfillment_work_source_event_id_stripe_event_receipts_event_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "app_private"."stripe_event_receipts"("event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" ADD CONSTRAINT "fulfillment_work_order_id_order_items_id_fk" FOREIGN KEY ("order_id") REFERENCES "app_private"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."order_items" ADD CONSTRAINT "order_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_private"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ADD CONSTRAINT "order_products_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "app_private"."order_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ADD CONSTRAINT "order_products_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "app_private"."products_variants"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."products_variants" ADD CONSTRAINT "products_variants_product_id_products_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "app_private"."products_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_private"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_private"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app_private"."wishlist" ADD CONSTRAINT "wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_private"."products_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_account_user_id" ON "app_private"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_account_provider_account" ON "app_private"."account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_cart_user_id" ON "app_private"."cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cart_variant_id" ON "app_private"."cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_cart_updated_at" ON "app_private"."cart_items" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_cart_user_variant_size" ON "app_private"."cart_items" USING btree ("user_id","variant_id","size");--> statement-breakpoint
CREATE INDEX "idx_customer_info_order_id" ON "app_private"."customer_info" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_customer_info_stripe_order_id" ON "app_private"."customer_info" USING btree ("stripe_order_id");--> statement-breakpoint
CREATE INDEX "idx_customer_info_email" ON "app_private"."customer_info" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_fulfillment_effect_claim" ON "app_private"."fulfillment_effects" USING btree ("state","next_attempt_at","lease_expires_at");--> statement-breakpoint
CREATE INDEX "idx_fulfillment_effect_work" ON "app_private"."fulfillment_effects" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "idx_fulfillment_work_claim" ON "app_private"."fulfillment_work" USING btree ("state","next_attempt_at","lease_expires_at");--> statement-breakpoint
CREATE INDEX "idx_order_items_user_id" ON "app_private"."order_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_number" ON "app_private"."order_items" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_order_items_created_at" ON "app_private"."order_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_order_items_delivery_date" ON "app_private"."order_items" USING btree ("delivery_date");--> statement-breakpoint
CREATE INDEX "idx_order_items_user_created" ON "app_private"."order_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_order_products_order_id" ON "app_private"."order_products" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_products_variant_id" ON "app_private"."order_products" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "app_private"."products_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "app_private"."products_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_products_created_at" ON "app_private"."products_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_products_updated_at" ON "app_private"."products_items" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_variants_product_id" ON "app_private"."products_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variants_stripe_id" ON "app_private"."products_variants" USING btree ("stripe_id");--> statement-breakpoint
CREATE INDEX "idx_variants_color" ON "app_private"."products_variants" USING btree ("color");--> statement-breakpoint
CREATE INDEX "idx_variants_created_at" ON "app_private"."products_variants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_variants_updated_at" ON "app_private"."products_variants" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "app_private"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_expires_at" ON "app_private"."session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_stripe_event_type" ON "app_private"."stripe_event_receipts" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_stripe_event_object_id" ON "app_private"."stripe_event_receipts" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "app_private"."user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_created_at" ON "app_private"."user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "app_private"."user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_verification_identifier" ON "app_private"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_verification_expires_at" ON "app_private"."verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_wishlist_user_id" ON "app_private"."wishlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wishlist_product_id" ON "app_private"."wishlist" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_wishlist_updated_at" ON "app_private"."wishlist" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_wishlist_user_product" ON "app_private"."wishlist" USING btree ("user_id","product_id");