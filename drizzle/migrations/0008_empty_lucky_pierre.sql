ALTER TABLE "app_private"."fulfillment_work" ADD COLUMN "payment_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" ADD COLUMN "payment_confirmation_event_id" text;--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" ADD CONSTRAINT "fulfillment_work_payment_confirmation_event_id_stripe_event_receipts_event_id_fk" FOREIGN KEY ("payment_confirmation_event_id") REFERENCES "app_private"."stripe_event_receipts"("event_id") ON DELETE restrict ON UPDATE no action;
REVOKE DELETE ON
  app_private.products_items,
  app_private.products_variants
FROM app_runtime;
