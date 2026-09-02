ALTER TABLE "app_private"."fulfillment_work" DROP CONSTRAINT "fulfillment_work_source_event_id_stripe_event_receipts_event_id_fk";
--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" DROP CONSTRAINT "fulfillment_work_payment_confirmation_event_id_stripe_event_receipts_event_id_fk";
--> statement-breakpoint
ALTER TABLE "app_private"."historical_order_price_evidence" DROP CONSTRAINT "historical_order_price_evidence_order_product_id_order_products_id_fk";
--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" ADD CONSTRAINT "fulfillment_work_source_event_fk" FOREIGN KEY ("source_event_id") REFERENCES "app_private"."stripe_event_receipts"("event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."fulfillment_work" ADD CONSTRAINT "fulfillment_work_payment_confirmation_event_fk" FOREIGN KEY ("payment_confirmation_event_id") REFERENCES "app_private"."stripe_event_receipts"("event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_private"."historical_order_price_evidence" ADD CONSTRAINT "historical_price_evidence_order_product_fk" FOREIGN KEY ("order_product_id") REFERENCES "app_private"."order_products"("id") ON DELETE restrict ON UPDATE no action;