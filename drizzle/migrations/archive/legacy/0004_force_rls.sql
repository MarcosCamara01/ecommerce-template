-- ========================================
-- FORCE ROW LEVEL SECURITY
-- ========================================
-- Migrations 0002 and 0003 run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
-- and create the per-user policies. That is not sufficient: PostgreSQL does
-- NOT apply RLS policies to the role that OWNS the table unless
-- `FORCE ROW LEVEL SECURITY` is also set.
--
-- This template uses a single DATABASE_URL both to run migrations (which
-- CREATE the tables, making that role the owner) and for the app at runtime,
-- so the app connects as the table owner and every policy from 0002/0003 is
-- silently ignored. See report #1628.
--
-- FORCE is idempotent and safe to re-run.
--
-- NOTE: FORCE also applies to the owner running future migrations. Any
-- migration that needs to bypass a policy must use a role with BYPASSRLS or
-- temporarily `ALTER TABLE ... NO FORCE ROW LEVEL SECURITY`.

DO $$
DECLARE
  target_table TEXT;
  rls_tables CONSTANT TEXT[] := ARRAY[
    'user',
    'session',
    'account',
    'verification',
    'products_items',
    'products_variants',
    'cart_items',
    'wishlist',
    'order_items',
    'customer_info',
    'order_products'
  ];
BEGIN
  FOREACH target_table IN ARRAY rls_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = target_table
    ) THEN
      -- ENABLE is repeated here so the table is in a known state even if this
      -- migration is applied to a database that skipped 0002/0003.
      EXECUTE format(
        'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
        target_table
      );
      EXECUTE format(
        'ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',
        target_table
      );
    END IF;
  END LOOP;
END
$$;
