ALTER TABLE "customer_info"
ADD CONSTRAINT "customer_info_stripe_order_id_unique"
UNIQUE ("stripe_order_id");
