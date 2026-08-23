ALTER TABLE "app_private"."order_items" ADD COLUMN "status" text DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ADD COLUMN "product_name" text;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ADD COLUMN "variant_color" text;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ADD COLUMN "image_url" text;--> statement-breakpoint
UPDATE "app_private"."order_products" AS line
SET "product_name" = product."name",
    "variant_color" = variant."color",
    "image_url" = coalesce(variant."images"[1], product."img")
FROM "app_private"."products_variants" AS variant
JOIN "app_private"."products_items" AS product
  ON product."id" = variant."product_id"
WHERE line."variant_id" = variant."id";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "app_private"."order_products"
    WHERE "product_name" IS NULL
       OR "variant_color" IS NULL
       OR "image_url" IS NULL
  ) THEN
    RAISE EXCEPTION 'Historical order display backfill is incomplete';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ALTER COLUMN "product_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ALTER COLUMN "variant_color" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app_private"."order_products" ALTER COLUMN "image_url" SET NOT NULL;
