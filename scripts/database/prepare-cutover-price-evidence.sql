-- Run as the same legacy-owner/cutover actor that owns every public application
-- table and will execute cutover-existing.sql. The temporary table deliberately
-- remains owned by this actor until cutover archives and drops it. Populate every
-- row from Stripe Checkout Session line-item responses; never derive values from
-- the current application catalog.

DO $$
DECLARE object_name text;
DECLARE object_owner text;
BEGIN
  FOREACH object_name IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification', 'products_items',
    'products_variants', 'cart_items', 'wishlist', 'order_items',
    'customer_info', 'order_products'
  ] LOOP
    SELECT pg_get_userbyid(table_row.relowner)
    INTO object_owner
    FROM pg_class table_row
    WHERE table_row.oid = to_regclass(format('public.%I', object_name));

    IF object_owner IS NULL THEN
      RAISE EXCEPTION 'Required legacy table public.% is missing', object_name;
    END IF;
    IF object_owner IS DISTINCT FROM current_user THEN
      RAISE EXCEPTION 'Legacy table public.% is owned by %, not cutover actor %',
        object_name, object_owner, current_user;
    END IF;
  END LOOP;
END
$$;

CREATE TABLE IF NOT EXISTS public.cutover_order_price_evidence (
  order_product_id bigint PRIMARY KEY,
  stripe_session_id text NOT NULL,
  stripe_line_item_id text NOT NULL UNIQUE,
  unit_amount bigint NOT NULL CHECK (unit_amount >= 0),
  currency text NOT NULL CHECK (char_length(currency) = 3)
);

DO $$
DECLARE object_owner text;
BEGIN
  SELECT pg_get_userbyid(table_row.relowner)
  INTO object_owner
  FROM pg_class table_row
  WHERE table_row.oid = 'public.cutover_order_price_evidence'::regclass;

  IF object_owner IS DISTINCT FROM current_user THEN
    RAISE EXCEPTION 'Temporary price evidence is owned by %, not cutover actor %',
      object_owner, current_user;
  END IF;
END
$$;

REVOKE ALL ON public.cutover_order_price_evidence FROM PUBLIC, app_runtime;
