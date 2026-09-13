REVOKE ALL PRIVILEGES ON SCHEMA app_private FROM PUBLIC, app_runtime;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA app_private FROM PUBLIC, app_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app_private FROM PUBLIC, app_runtime;

GRANT USAGE ON SCHEMA app_private TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  app_private."user",
  app_private.session,
  app_private.account,
  app_private.verification,
  app_private.cart_items,
  app_private.wishlist
TO app_runtime;

GRANT SELECT, INSERT, UPDATE ON
  app_private.products_items,
  app_private.products_variants
TO app_runtime;

GRANT SELECT, INSERT ON app_private.checkout_intents TO app_runtime;

GRANT SELECT, INSERT ON
  app_private.order_items,
  app_private.customer_info,
  app_private.order_products
TO app_runtime;

GRANT INSERT ON app_private.stripe_event_receipts TO app_runtime;
GRANT SELECT (event_id) ON app_private.stripe_event_receipts TO app_runtime;

GRANT SELECT, INSERT, UPDATE ON
  app_private.fulfillment_work,
  app_private.fulfillment_effects
TO app_runtime;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA app_private TO app_runtime;
