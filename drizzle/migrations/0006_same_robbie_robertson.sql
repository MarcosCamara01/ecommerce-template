ALTER TABLE "app_private"."products_items" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_private"."products_variants" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_products_archived_at" ON "app_private"."products_items" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_variants_archived_at" ON "app_private"."products_variants" USING btree ("archived_at");