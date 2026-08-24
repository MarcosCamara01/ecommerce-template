-- Existing-database cutover. Rehearse this exact file on a disposable restore.
-- Preconditions and rollback gates are documented in docs/runbooks/database-cutover.md.

BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'pg_catalog.pg_index'::regclass
      AND attname = 'indnullsnotdistinct'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION
      'Database cutover requires PostgreSQL 15+ catalog support for pg_index.indnullsnotdistinct';
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS app_private AUTHORIZATION app_owner;

DO $$
DECLARE object_name text;
BEGIN
  FOREACH object_name IN ARRAY ARRAY['product_category', 'sizes'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = object_name
    ) THEN
      EXECUTE format('ALTER TYPE public.%I SET SCHEMA app_private', object_name);
      EXECUTE format('ALTER TYPE app_private.%I OWNER TO app_owner', object_name);
    END IF;
  END LOOP;

  FOREACH object_name IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification', 'products_items',
    'products_variants', 'cart_items', 'wishlist', 'order_items',
    'customer_info', 'order_products'
  ] LOOP
    IF to_regclass(format('public.%I', object_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA app_private', object_name);
    END IF;
  END LOOP;
END
$$;

ALTER TABLE app_private."user"
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS ban_expires timestamptz;
ALTER TABLE app_private.session
  ADD COLUMN IF NOT EXISTS impersonated_by text;
ALTER TABLE app_private.customer_info
  ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE app_private.products_items
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE app_private.products_variants
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE app_private.order_products
  ADD COLUMN IF NOT EXISTS unit_amount bigint,
  ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE app_private.order_items
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed' NOT NULL;
UPDATE app_private.order_items SET status = 'confirmed' WHERE status IS NULL;
ALTER TABLE app_private.order_items ALTER COLUMN status SET DEFAULT 'confirmed';
ALTER TABLE app_private.order_items ALTER COLUMN status SET NOT NULL;
ALTER TABLE app_private.order_products
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS variant_color text,
  ADD COLUMN IF NOT EXISTS image_url text;

UPDATE app_private.order_products AS line
SET product_name = product.name,
    variant_color = variant.color,
    image_url = coalesce(variant.images[1], product.img)
FROM app_private.products_variants AS variant
JOIN app_private.products_items AS product
  ON product.id = variant.product_id
WHERE line.variant_id = variant.id
  AND (
    line.product_name IS NULL
    OR line.variant_color IS NULL
    OR line.image_url IS NULL
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM app_private.order_products
    WHERE product_name IS NULL
       OR variant_color IS NULL
       OR image_url IS NULL
  ) THEN
    RAISE EXCEPTION 'Historical order display backfill is incomplete';
  END IF;
END
$$;
ALTER TABLE app_private.order_products ALTER COLUMN product_name SET NOT NULL;
ALTER TABLE app_private.order_products ALTER COLUMN variant_color SET NOT NULL;
ALTER TABLE app_private.order_products ALTER COLUMN image_url SET NOT NULL;

DO $$
DECLARE historical_lines boolean;
DECLARE invalid_evidence boolean;
DECLARE evidence_owner text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM app_private.order_products
  ) INTO historical_lines;

  IF historical_lines THEN
    IF to_regclass('public.cutover_order_price_evidence') IS NOT NULL THEN
      SELECT pg_get_userbyid(table_row.relowner)
      INTO evidence_owner
      FROM pg_class table_row
      WHERE table_row.oid = 'public.cutover_order_price_evidence'::regclass;
      IF evidence_owner IS DISTINCT FROM current_user THEN
        RAISE EXCEPTION 'Temporary price evidence is owned by %, not cutover actor %',
          evidence_owner, current_user;
      END IF;

      EXECUTE $prepared_evidence_check$
        SELECT EXISTS (
          SELECT 1
          FROM app_private.order_products op
          JOIN app_private.order_items orders ON orders.id = op.order_id
          LEFT JOIN app_private.customer_info customer ON customer.order_id = orders.id
          LEFT JOIN public.cutover_order_price_evidence evidence
            ON evidence.order_product_id = op.id
          WHERE evidence.order_product_id IS NULL
            OR customer.stripe_order_id IS DISTINCT FROM evidence.stripe_session_id
            OR evidence.unit_amount < 0
            OR char_length(evidence.currency) <> 3
            OR (op.unit_amount IS NOT NULL AND op.unit_amount <> evidence.unit_amount)
            OR (op.currency IS NOT NULL AND lower(op.currency) <> lower(evidence.currency))
            OR (customer.currency IS NOT NULL AND lower(customer.currency) <> lower(evidence.currency))
        )
      $prepared_evidence_check$ INTO invalid_evidence;
      IF invalid_evidence THEN
        RAISE EXCEPTION 'Prepared historical Stripe price evidence is incomplete or inconsistent';
      END IF;

      EXECUTE $order_backfill$
        UPDATE app_private.order_products op
        SET unit_amount = evidence.unit_amount,
            currency = lower(evidence.currency)
        FROM public.cutover_order_price_evidence evidence,
             app_private.customer_info customer
        WHERE evidence.order_product_id = op.id
          AND customer.order_id = op.order_id
          AND customer.stripe_order_id = evidence.stripe_session_id
      $order_backfill$;

      EXECUTE $customer_backfill$
        UPDATE app_private.customer_info customer
        SET currency = verified.currency
        FROM (
          SELECT op.order_id, min(lower(evidence.currency)) AS currency
          FROM app_private.order_products op
          JOIN public.cutover_order_price_evidence evidence
            ON evidence.order_product_id = op.id
          GROUP BY op.order_id
          HAVING count(DISTINCT lower(evidence.currency)) = 1
        ) verified
        WHERE customer.order_id = verified.order_id AND customer.currency IS NULL
      $customer_backfill$;
    ELSIF to_regclass('app_private.historical_order_price_evidence') IS NOT NULL THEN
      EXECUTE $archived_evidence_check$
        SELECT EXISTS (
          SELECT 1
          FROM app_private.order_products op
          JOIN app_private.order_items orders ON orders.id = op.order_id
          LEFT JOIN app_private.customer_info customer ON customer.order_id = orders.id
          LEFT JOIN app_private.historical_order_price_evidence evidence
            ON evidence.order_product_id = op.id
          WHERE evidence.order_product_id IS NULL
            OR customer.stripe_order_id IS DISTINCT FROM evidence.stripe_session_id
            OR evidence.unit_amount < 0
            OR char_length(evidence.currency) <> 3
            OR op.unit_amount IS DISTINCT FROM evidence.unit_amount
            OR lower(op.currency) IS DISTINCT FROM lower(evidence.currency)
            OR lower(customer.currency) IS DISTINCT FROM lower(evidence.currency)
        )
      $archived_evidence_check$ INTO invalid_evidence;
      IF invalid_evidence THEN
        RAISE EXCEPTION 'Archived historical Stripe price evidence is incomplete or inconsistent';
      END IF;
    ELSE
      RAISE EXCEPTION 'Prepared or fully archived Stripe price evidence is required';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM app_private.order_products
    WHERE unit_amount IS NULL OR currency IS NULL
  ) OR EXISTS (
    SELECT 1 FROM app_private.customer_info WHERE currency IS NULL
  ) THEN
    RAISE EXCEPTION 'Historical Stripe price backfill is incomplete';
  END IF;
END
$$;
ALTER TABLE app_private.order_products ALTER COLUMN unit_amount SET NOT NULL;
ALTER TABLE app_private.order_products ALTER COLUMN currency SET NOT NULL;
ALTER TABLE app_private.order_products ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE app_private.customer_info ALTER COLUMN currency SET NOT NULL;
ALTER TABLE app_private.customer_info ALTER COLUMN currency SET DEFAULT 'eur';

DO $$
DECLARE constraint_expression text;
BEGIN
  SELECT regexp_replace(
    lower(pg_get_expr(constraint_row.conbin, constraint_row.conrelid, true)),
    '[[:space:]()]',
    '',
    'g'
  ) INTO constraint_expression
  FROM pg_constraint constraint_row
  WHERE constraint_row.conname = 'order_quantity_positive'
    AND constraint_row.conrelid = 'app_private.order_products'::regclass;
  IF constraint_expression IS NOT NULL AND constraint_expression <> 'quantity>0' THEN
    RAISE EXCEPTION 'Constraint order_quantity_positive has a non-canonical definition';
  END IF;
  IF constraint_expression IS NULL THEN
    ALTER TABLE app_private.order_products
      ADD CONSTRAINT order_quantity_positive CHECK (quantity > 0);
  END IF;

  constraint_expression := NULL;
  SELECT regexp_replace(
    lower(pg_get_expr(constraint_row.conbin, constraint_row.conrelid, true)),
    '[[:space:]()]',
    '',
    'g'
  ) INTO constraint_expression
  FROM pg_constraint constraint_row
  WHERE constraint_row.conname = 'order_unit_amount_nonnegative'
    AND constraint_row.conrelid = 'app_private.order_products'::regclass;
  IF constraint_expression IS NOT NULL AND constraint_expression <> 'unit_amount>=0' THEN
    RAISE EXCEPTION 'Constraint order_unit_amount_nonnegative has a non-canonical definition';
  END IF;
  IF constraint_expression IS NULL THEN
    ALTER TABLE app_private.order_products
      ADD CONSTRAINT order_unit_amount_nonnegative CHECK (unit_amount >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_status_valid'
      AND conrelid = 'app_private.order_items'::regclass
  ) THEN
    ALTER TABLE app_private.order_items
      ADD CONSTRAINT order_status_valid
      CHECK (status IN ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS app_private.historical_order_price_evidence (
  order_product_id bigint PRIMARY KEY,
  stripe_session_id text NOT NULL,
  stripe_line_item_id text NOT NULL,
  unit_amount bigint NOT NULL,
  currency text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT historical_price_stripe_line_item_unique UNIQUE(stripe_line_item_id),
  CONSTRAINT historical_price_unit_amount_nonnegative CHECK(unit_amount >= 0),
  CONSTRAINT historical_price_currency_length CHECK(char_length(currency) = 3),
  CONSTRAINT historical_price_evidence_order_product_fk
    FOREIGN KEY(order_product_id) REFERENCES app_private.order_products(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION
);

DO $$
DECLARE conflicting_existing_evidence boolean;
BEGIN
  IF to_regclass('public.cutover_order_price_evidence') IS NOT NULL THEN
    EXECUTE $conflicting_evidence$
      SELECT EXISTS (
        SELECT 1
        FROM public.cutover_order_price_evidence source
        JOIN app_private.historical_order_price_evidence destination
          ON destination.order_product_id = source.order_product_id
          OR destination.stripe_line_item_id = source.stripe_line_item_id
        WHERE ROW(
          destination.order_product_id,
          destination.stripe_session_id,
          destination.stripe_line_item_id,
          destination.unit_amount,
          lower(destination.currency)
        ) IS DISTINCT FROM ROW(
          source.order_product_id,
          source.stripe_session_id,
          source.stripe_line_item_id,
          source.unit_amount,
          lower(source.currency)
        )
      )
    $conflicting_evidence$ INTO conflicting_existing_evidence;
    IF conflicting_existing_evidence THEN
      RAISE EXCEPTION 'Historical Stripe price evidence conflicts with archived evidence';
    END IF;

    EXECUTE $archive_evidence$
      INSERT INTO app_private.historical_order_price_evidence
        (order_product_id, stripe_session_id, stripe_line_item_id, unit_amount, currency)
      SELECT order_product_id, stripe_session_id, stripe_line_item_id,
             unit_amount, lower(currency)
      FROM public.cutover_order_price_evidence
      ON CONFLICT (order_product_id) DO NOTHING
    $archive_evidence$;
    DROP TABLE public.cutover_order_price_evidence;
  END IF;
END
$$;
ALTER TABLE app_private.historical_order_price_evidence OWNER TO app_owner;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'historical_order_price_evidence_order_product_id_order_products'
      AND conrelid = 'app_private.historical_order_price_evidence'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'historical_price_evidence_order_product_fk'
      AND conrelid = 'app_private.historical_order_price_evidence'::regclass
  ) THEN
    ALTER TABLE app_private.historical_order_price_evidence
      RENAME CONSTRAINT historical_order_price_evidence_order_product_id_order_products
      TO historical_price_evidence_order_product_fk;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'historical_price_evidence_order_product_fk'
      AND conrelid = 'app_private.historical_order_price_evidence'::regclass
  ) THEN
    ALTER TABLE app_private.historical_order_price_evidence
      ADD CONSTRAINT historical_price_evidence_order_product_fk
      FOREIGN KEY(order_product_id) REFERENCES app_private.order_products(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END
$$;

DO $$
DECLARE table_name text;
DECLARE policy_name text;
BEGIN
  FOR table_name, policy_name IN
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'app_private'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON app_private.%I', policy_name, table_name);
  END LOOP;
END
$$;

DO $$
DECLARE object_name text;
BEGIN
  FOREACH object_name IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification', 'products_items',
    'products_variants', 'cart_items', 'wishlist', 'order_items',
    'customer_info', 'order_products'
  ] LOOP
    -- RLS is moot here: app_private is unreachable by any client role. See
    -- .react-doctor/false-positives.md and the override in doctor.config.json.
    EXECUTE format('ALTER TABLE app_private.%I DISABLE ROW LEVEL SECURITY', object_name);
    EXECUTE format('ALTER TABLE app_private.%I NO FORCE ROW LEVEL SECURITY', object_name);
    EXECUTE format('ALTER TABLE app_private.%I OWNER TO app_owner', object_name);
  END LOOP;
END
$$;

DO $$
DECLARE sequence_name text;
BEGIN
  FOR sequence_name IN
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'app_private'
  LOOP
    EXECUTE format('ALTER SEQUENCE app_private.%I OWNER TO app_owner', sequence_name);
  END LOOP;
END
$$;

DROP FUNCTION IF EXISTS app.current_user_id() RESTRICT;
DROP SCHEMA IF EXISTS app RESTRICT;

SET LOCAL ROLE app_owner;

DO $$
BEGIN
  CREATE TYPE app_private.catalog_sync_action AS ENUM ('upsert', 'archive');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;
DO $$
BEGIN
  CREATE TYPE app_private.catalog_sync_state AS ENUM ('preparing', 'cancelling', 'pending', 'processing', 'retry_wait', 'needs_attention', 'succeeded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;
ALTER TYPE app_private.catalog_sync_state
  ADD VALUE IF NOT EXISTS 'preparing' BEFORE 'pending';
ALTER TYPE app_private.catalog_sync_state
  ADD VALUE IF NOT EXISTS 'cancelling' AFTER 'preparing';
ALTER TYPE app_private.catalog_sync_state
  ADD VALUE IF NOT EXISTS 'cancelled' AFTER 'succeeded';

DO $$
BEGIN
  CREATE TYPE app_private.fulfillment_state AS ENUM (
    'pending', 'processing', 'succeeded', 'needs_attention'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;
DO $$
BEGIN
  CREATE TYPE app_private.fulfillment_effect_kind AS ENUM (
    'order_email', 'cart_cleanup'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;
DO $$
BEGIN
  CREATE TYPE app_private.fulfillment_effect_state AS ENUM (
    'pending', 'processing', 'succeeded', 'needs_attention'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS app_private.stripe_event_receipts (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  object_id text,
  stripe_created_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_private.checkout_intents (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  checkout_session_id text,
  items jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkout_intent_session_unique UNIQUE(checkout_session_id),
  CONSTRAINT checkout_intents_user_id_user_id_fk FOREIGN KEY(user_id)
    REFERENCES app_private."user"(id) ON DELETE RESTRICT ON UPDATE NO ACTION
);
CREATE TABLE IF NOT EXISTS app_private.catalog_sync_operations (
  id uuid PRIMARY KEY,
  product_id bigint NOT NULL,
  active_product_id bigint,
  action app_private.catalog_sync_action NOT NULL,
  request_hash text,
  state app_private.catalog_sync_state NOT NULL DEFAULT 'pending',
  target jsonb NOT NULL,
  stripe_result jsonb,
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  last_error_code text,
  last_error_detail text,
  last_operator_user_id text,
  last_operator_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT catalog_sync_active_product_unique UNIQUE(active_product_id),
  CONSTRAINT catalog_sync_attempt_count_check CHECK(attempt_count >= 0),
  CONSTRAINT catalog_sync_active_product_check CHECK(active_product_id IS NULL OR active_product_id = product_id),
  CONSTRAINT catalog_sync_lease_pair_check CHECK((lease_owner IS NULL) = (lease_expires_at IS NULL)),
  CONSTRAINT catalog_sync_terminal_check CHECK((state::text IN ('succeeded', 'cancelled')) = (active_product_id IS NULL)),
  CONSTRAINT catalog_sync_operations_product_id_products_items_id_fk FOREIGN KEY(product_id) REFERENCES app_private.products_items(id) ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT catalog_sync_operations_active_product_id_products_items_id_fk FOREIGN KEY(active_product_id) REFERENCES app_private.products_items(id) ON DELETE RESTRICT ON UPDATE NO ACTION
);
ALTER TABLE app_private.catalog_sync_operations
  ADD COLUMN IF NOT EXISTS request_hash text;
ALTER TABLE app_private.catalog_sync_operations
  DROP CONSTRAINT IF EXISTS catalog_sync_terminal_check;
ALTER TABLE app_private.catalog_sync_operations
  ADD CONSTRAINT catalog_sync_terminal_check
  CHECK((state::text IN ('succeeded', 'cancelled')) = (active_product_id IS NULL));
CREATE TABLE IF NOT EXISTS app_private.catalog_sync_replay_audit (
  id bigserial PRIMARY KEY,
  operation_id uuid NOT NULL,
  prior_state text NOT NULL,
  prior_error_code text,
  prior_error_detail text,
  operator_user_id text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_sync_replay_operation_fk
    FOREIGN KEY(operation_id) REFERENCES app_private.catalog_sync_operations(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT catalog_sync_replay_prior_state_check
    CHECK(prior_state = 'needs_attention'),
  CONSTRAINT catalog_sync_replay_reason_check
    CHECK(char_length(btrim(reason)) BETWEEN 1 AND 500)
);
CREATE TABLE IF NOT EXISTS app_private.fulfillment_work (
  id bigserial PRIMARY KEY,
  checkout_session_id text NOT NULL,
  source_event_id text,
  payment_confirmed_at timestamptz,
  payment_confirmation_event_id text,
  state app_private.fulfillment_state NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  last_error_code text,
  last_error_detail text,
  order_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_work_checkout_session_unique UNIQUE(checkout_session_id),
  CONSTRAINT fulfillment_work_order_unique UNIQUE(order_id),
  CONSTRAINT fulfillment_work_source_event_fk
    FOREIGN KEY(source_event_id) REFERENCES app_private.stripe_event_receipts(event_id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT fulfillment_work_payment_confirmation_event_fk
    FOREIGN KEY(payment_confirmation_event_id) REFERENCES app_private.stripe_event_receipts(event_id)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT fulfillment_work_order_id_order_items_id_fk
    FOREIGN KEY(order_id) REFERENCES app_private.order_items(id)
    ON DELETE RESTRICT ON UPDATE NO ACTION
);
ALTER TABLE app_private.fulfillment_work
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmation_event_id text;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fulfillment_work_source_event_id_stripe_event_receipts_event_id'
      AND conrelid = 'app_private.fulfillment_work'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fulfillment_work_source_event_fk'
      AND conrelid = 'app_private.fulfillment_work'::regclass
  ) THEN
    ALTER TABLE app_private.fulfillment_work
      RENAME CONSTRAINT fulfillment_work_source_event_id_stripe_event_receipts_event_id
      TO fulfillment_work_source_event_fk;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fulfillment_work_source_event_fk'
      AND conrelid = 'app_private.fulfillment_work'::regclass
  ) THEN
    ALTER TABLE app_private.fulfillment_work
      ADD CONSTRAINT fulfillment_work_source_event_fk
      FOREIGN KEY(source_event_id)
      REFERENCES app_private.stripe_event_receipts(event_id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fulfillment_work_payment_confirmation_event_id_stripe_event_rec'
      AND conrelid = 'app_private.fulfillment_work'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fulfillment_work_payment_confirmation_event_fk'
      AND conrelid = 'app_private.fulfillment_work'::regclass
  ) THEN
    ALTER TABLE app_private.fulfillment_work
      RENAME CONSTRAINT fulfillment_work_payment_confirmation_event_id_stripe_event_rec
      TO fulfillment_work_payment_confirmation_event_fk;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fulfillment_work_payment_confirmation_event_fk'
      AND conrelid = 'app_private.fulfillment_work'::regclass
  ) THEN
    ALTER TABLE app_private.fulfillment_work
      ADD CONSTRAINT fulfillment_work_payment_confirmation_event_fk
      FOREIGN KEY(payment_confirmation_event_id)
      REFERENCES app_private.stripe_event_receipts(event_id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END
$$;
CREATE TABLE IF NOT EXISTS app_private.fulfillment_effects (
  id bigserial PRIMARY KEY,
  work_id bigint NOT NULL,
  kind app_private.fulfillment_effect_kind NOT NULL,
  state app_private.fulfillment_effect_state NOT NULL DEFAULT 'pending',
  idempotency_key text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  last_error_code text,
  last_error_detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_effect_idempotency_unique UNIQUE(idempotency_key),
  CONSTRAINT fulfillment_effects_work_id_fulfillment_work_id_fk
    FOREIGN KEY(work_id) REFERENCES app_private.fulfillment_work(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE IF NOT EXISTS app_private.fulfillment_replay_audit (
  id bigserial PRIMARY KEY,
  target_kind text NOT NULL,
  target_id text NOT NULL,
  prior_state text NOT NULL,
  operator_user_id text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_replay_audit_target_kind_check
    CHECK(target_kind IN ('work', 'effect')),
  CONSTRAINT fulfillment_replay_audit_prior_state_check
    CHECK(prior_state = 'needs_attention'),
  CONSTRAINT fulfillment_replay_audit_reason_check
    CHECK(char_length(btrim(reason)) BETWEEN 1 AND 500)
);

DO $$
DECLARE canonical_constraint record;
BEGIN
  FOR canonical_constraint IN
    SELECT constraint_row.conrelid AS table_oid,
           constraint_row.conname AS constraint_name,
           constraint_row.contype AS constraint_type,
           constraint_row.convalidated AS validated,
           constraint_row.condeferrable AS deferrable,
           constraint_row.condeferred AS initially_deferred,
           backing_index.indnullsnotdistinct AS nulls_not_distinct
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
    LEFT JOIN pg_index backing_index
      ON backing_index.indexrelid = constraint_row.conindid
    WHERE namespace_row.nspname = 'app_private'
      AND constraint_row.contype IN ('c', 'f', 'u')
  LOOP
    IF canonical_constraint.deferrable OR canonical_constraint.initially_deferred THEN
      RAISE EXCEPTION 'Constraint % has non-canonical deferrability semantics',
        canonical_constraint.constraint_name;
    END IF;

    IF canonical_constraint.constraint_type = 'u'
      AND canonical_constraint.nulls_not_distinct IS DISTINCT FROM false
    THEN
      RAISE EXCEPTION 'Constraint % has non-canonical NULL uniqueness semantics',
        canonical_constraint.constraint_name;
    END IF;

    IF NOT canonical_constraint.validated THEN
      EXECUTE format(
        'ALTER TABLE %s VALIDATE CONSTRAINT %I',
        canonical_constraint.table_oid::regclass,
        canonical_constraint.constraint_name
      );
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE expected_index record;
DECLARE actual_index record;
DECLARE quoted_columns text;
DECLARE expected_is_unique boolean;
DECLARE named_index_exists boolean;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM app_private.account
    GROUP BY provider_id, account_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'OAuth account uniqueness cutover aborted: duplicate provider_id/account_id rows require explicit operator resolution';
  END IF;

  FOR expected_index IN
    SELECT * FROM (VALUES
      ('idx_account_user_id', 'account', ARRAY['user_id']::text[]),
      ('idx_account_provider_account', 'account', ARRAY['provider_id', 'account_id']::text[]),
      ('idx_cart_user_id', 'cart_items', ARRAY['user_id']::text[]),
      ('idx_cart_variant_id', 'cart_items', ARRAY['variant_id']::text[]),
      ('idx_cart_updated_at', 'cart_items', ARRAY['updated_at']::text[]),
      ('idx_cart_user_variant_size', 'cart_items', ARRAY['user_id', 'variant_id', 'size']::text[]),
      ('idx_customer_info_order_id', 'customer_info', ARRAY['order_id']::text[]),
      ('idx_customer_info_stripe_order_id', 'customer_info', ARRAY['stripe_order_id']::text[]),
      ('idx_customer_info_email', 'customer_info', ARRAY['email']::text[]),
      ('idx_order_items_user_id', 'order_items', ARRAY['user_id']::text[]),
      ('idx_order_items_order_number', 'order_items', ARRAY['order_number']::text[]),
      ('idx_order_items_created_at', 'order_items', ARRAY['created_at']::text[]),
      ('idx_order_items_delivery_date', 'order_items', ARRAY['delivery_date']::text[]),
      ('idx_order_items_user_created', 'order_items', ARRAY['user_id', 'created_at']::text[]),
      ('idx_order_products_order_id', 'order_products', ARRAY['order_id']::text[]),
      ('idx_order_products_variant_id', 'order_products', ARRAY['variant_id']::text[]),
      ('idx_catalog_sync_claim', 'catalog_sync_operations', ARRAY['state', 'next_attempt_at', 'lease_expires_at']::text[]),
      ('idx_catalog_sync_product', 'catalog_sync_operations', ARRAY['product_id', 'created_at']::text[]),
      ('idx_catalog_sync_replay_operation', 'catalog_sync_replay_audit', ARRAY['operation_id', 'created_at']::text[]),
      ('idx_products_category', 'products_items', ARRAY['category']::text[]),
      ('idx_products_name', 'products_items', ARRAY['name']::text[]),
      ('idx_products_archived_at', 'products_items', ARRAY['archived_at']::text[]),
      ('idx_products_created_at', 'products_items', ARRAY['created_at']::text[]),
      ('idx_products_updated_at', 'products_items', ARRAY['updated_at']::text[]),
      ('idx_variants_product_id', 'products_variants', ARRAY['product_id']::text[]),
      ('idx_variants_stripe_id', 'products_variants', ARRAY['stripe_id']::text[]),
      ('idx_variants_color', 'products_variants', ARRAY['color']::text[]),
      ('idx_variants_archived_at', 'products_variants', ARRAY['archived_at']::text[]),
      ('idx_variants_created_at', 'products_variants', ARRAY['created_at']::text[]),
      ('idx_variants_updated_at', 'products_variants', ARRAY['updated_at']::text[]),
      ('idx_session_user_id', 'session', ARRAY['user_id']::text[]),
      ('idx_session_expires_at', 'session', ARRAY['expires_at']::text[]),
      ('idx_user_email', 'user', ARRAY['email']::text[]),
      ('idx_user_created_at', 'user', ARRAY['created_at']::text[]),
      ('idx_user_role', 'user', ARRAY['role']::text[]),
      ('idx_verification_identifier', 'verification', ARRAY['identifier']::text[]),
      ('idx_verification_expires_at', 'verification', ARRAY['expires_at']::text[]),
      ('idx_wishlist_user_id', 'wishlist', ARRAY['user_id']::text[]),
      ('idx_wishlist_product_id', 'wishlist', ARRAY['product_id']::text[]),
      ('idx_wishlist_updated_at', 'wishlist', ARRAY['updated_at']::text[]),
      ('idx_wishlist_user_product', 'wishlist', ARRAY['user_id', 'product_id']::text[]),
      ('idx_stripe_event_type', 'stripe_event_receipts', ARRAY['event_type']::text[]),
      ('idx_checkout_intent_user', 'checkout_intents', ARRAY['user_id']::text[]),
      ('idx_checkout_intent_expires', 'checkout_intents', ARRAY['expires_at']::text[]),
      ('idx_stripe_event_object_id', 'stripe_event_receipts', ARRAY['object_id']::text[]),
      ('idx_fulfillment_work_claim', 'fulfillment_work', ARRAY['state', 'next_attempt_at', 'lease_expires_at']::text[]),
      ('idx_fulfillment_effect_claim', 'fulfillment_effects', ARRAY['state', 'next_attempt_at', 'lease_expires_at']::text[]),
      ('idx_fulfillment_effect_work', 'fulfillment_effects', ARRAY['work_id']::text[]),
      ('idx_fulfillment_replay_audit_target', 'fulfillment_replay_audit', ARRAY['target_kind', 'target_id', 'created_at']::text[])
    ) AS contract(index_name, table_name, columns)
  LOOP
    expected_is_unique :=
      expected_index.index_name = 'idx_account_provider_account';

    SELECT
      table_row.relname AS table_name,
      access_method.amname AS method,
      metadata.indisunique AS is_unique,
      metadata.indnullsnotdistinct AS nulls_not_distinct,
      metadata.indisprimary AS is_primary,
      metadata.indisexclusion AS is_exclusion,
      metadata.indisvalid AS is_valid,
      metadata.indisready AS is_ready,
      metadata.indislive AS is_live,
      metadata.indpred IS NULL AS has_no_predicate,
      metadata.indexprs IS NULL AS has_no_expressions,
      metadata.indnatts AS total_attributes,
      metadata.indnkeyatts AS key_attributes,
      array_agg(attribute_row.attname ORDER BY key_row.ordinality) AS columns,
      bool_and(metadata.indoption[key_row.ordinality - 1] = 0) AS has_default_options,
      bool_and(opclass_row.opcdefault) AS has_default_opclasses,
      bool_and(
        metadata.indcollation[key_row.ordinality - 1]
          = attribute_row.attcollation
      ) AS has_default_collations,
      index_row.reloptions IS NULL AS has_default_storage
    INTO actual_index
    FROM pg_index metadata
    JOIN pg_class index_row ON index_row.oid = metadata.indexrelid
    JOIN pg_namespace namespace_row ON namespace_row.oid = index_row.relnamespace
    JOIN pg_class table_row ON table_row.oid = metadata.indrelid
    JOIN pg_am access_method ON access_method.oid = index_row.relam
    JOIN LATERAL unnest(metadata.indkey) WITH ORDINALITY
      AS key_row(attnum, ordinality)
      ON key_row.ordinality <= metadata.indnkeyatts
    LEFT JOIN pg_attribute attribute_row
      ON attribute_row.attrelid = metadata.indrelid
      AND attribute_row.attnum = key_row.attnum
    LEFT JOIN pg_opclass opclass_row
      ON opclass_row.oid = metadata.indclass[key_row.ordinality - 1]
    WHERE namespace_row.nspname = 'app_private'
      AND index_row.relname = expected_index.index_name
    GROUP BY table_row.relname, access_method.amname, metadata.indisunique,
      metadata.indnullsnotdistinct,
      metadata.indisprimary, metadata.indisexclusion, metadata.indisvalid,
      metadata.indisready, metadata.indislive, metadata.indpred,
      metadata.indexprs, metadata.indnatts, metadata.indnkeyatts,
      index_row.reloptions;

    -- FOUND is statement-local in PL/pgSQL. Preserve the pg_index result before
    -- the aggregate below, which always returns one row and would otherwise
    -- make a missing named index look present.
    named_index_exists := FOUND;

    SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinality)
    INTO quoted_columns
    FROM unnest(expected_index.columns) WITH ORDINALITY
      AS expected_column(column_name, ordinality);

    IF named_index_exists THEN
      IF actual_index.is_unique IS TRUE
        AND actual_index.nulls_not_distinct IS DISTINCT FROM false
      THEN
        RAISE EXCEPTION 'Index % has non-canonical NULL uniqueness semantics',
          expected_index.index_name;
      END IF;

      IF actual_index.table_name IS DISTINCT FROM expected_index.table_name
        OR actual_index.method IS DISTINCT FROM 'btree'
        OR actual_index.is_primary IS DISTINCT FROM false
        OR actual_index.is_exclusion IS DISTINCT FROM false
        OR actual_index.is_valid IS DISTINCT FROM true
        OR actual_index.is_ready IS DISTINCT FROM true
        OR actual_index.is_live IS DISTINCT FROM true
        OR actual_index.has_no_predicate IS DISTINCT FROM true
        OR actual_index.has_no_expressions IS DISTINCT FROM true
        OR actual_index.total_attributes IS DISTINCT FROM cardinality(expected_index.columns)
        OR actual_index.key_attributes IS DISTINCT FROM cardinality(expected_index.columns)
        OR actual_index.columns IS DISTINCT FROM expected_index.columns
        OR actual_index.has_default_options IS DISTINCT FROM true
        OR actual_index.has_default_opclasses IS DISTINCT FROM true
        OR actual_index.has_default_collations IS DISTINCT FROM true
        OR actual_index.has_default_storage IS DISTINCT FROM true
      THEN
        RAISE EXCEPTION 'Index % has a non-canonical definition', expected_index.index_name;
      END IF;

      IF actual_index.is_unique IS DISTINCT FROM expected_is_unique THEN
        IF expected_is_unique AND actual_index.is_unique IS FALSE THEN
          EXECUTE format(
            'DROP INDEX app_private.%I',
            expected_index.index_name
          );
          EXECUTE format(
            'CREATE UNIQUE INDEX %I ON app_private.%I USING btree (%s)',
            expected_index.index_name,
            expected_index.table_name,
            quoted_columns
          );
        ELSE
          RAISE EXCEPTION 'Index % has a non-canonical uniqueness definition',
            expected_index.index_name;
        END IF;
      END IF;
    ELSE
      EXECUTE format(
        'CREATE %sINDEX %I ON app_private.%I USING btree (%s)',
        CASE WHEN expected_is_unique THEN 'UNIQUE ' ELSE '' END,
        expected_index.index_name,
        expected_index.table_name,
        quoted_columns
      );
    END IF;
  END LOOP;
END
$$;

ALTER TABLE app_private.stripe_event_receipts OWNER TO app_owner;
ALTER TABLE app_private.checkout_intents OWNER TO app_owner;
ALTER TABLE app_private.catalog_sync_operations OWNER TO app_owner;
ALTER TABLE app_private.catalog_sync_replay_audit OWNER TO app_owner;
ALTER TABLE app_private.fulfillment_work OWNER TO app_owner;
ALTER TABLE app_private.fulfillment_effects OWNER TO app_owner;
ALTER TABLE app_private.fulfillment_replay_audit OWNER TO app_owner;

DO $$
DECLARE role_name text;
DECLARE routine_signature text;
DECLARE column_grant record;
DECLARE column_list text;
DECLARE grantee_sql text;
BEGIN
  FOR routine_signature IN
    SELECT routine.oid::regprocedure::text
    FROM pg_proc routine
    JOIN pg_namespace namespace_row ON namespace_row.oid = routine.pronamespace
    WHERE namespace_row.nspname = 'app_private'
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO app_owner', routine_signature);
  END LOOP;

  FOR role_name IN
    SELECT rolname
    FROM pg_roles
    WHERE rolname NOT IN ('app_owner', 'app_runtime')
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA app_private FROM %I',
      role_name
    );
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app_private FROM %I',
      role_name
    );
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA app_private FROM %I',
      role_name
    );
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON SCHEMA app_private FROM %I',
      role_name
    );
  END LOOP;

  FOR column_grant IN
    SELECT DISTINCT table_row.relname AS table_name,
           acl.grantee AS grantee_oid,
           coalesce(grantee.rolname, 'PUBLIC') AS grantee_name
    FROM pg_attribute attribute
    JOIN pg_class table_row ON table_row.oid = attribute.attrelid
    JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
    CROSS JOIN LATERAL aclexplode(attribute.attacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE namespace_row.nspname = 'app_private'
      AND coalesce(grantee.rolname, 'PUBLIC') NOT IN ('app_owner', 'app_runtime')
  LOOP
    SELECT string_agg(format('%I', granted_column.attname), ', ' ORDER BY granted_column.attnum)
    INTO column_list
    FROM (
      SELECT DISTINCT attribute.attname, attribute.attnum
      FROM pg_attribute attribute
      CROSS JOIN LATERAL aclexplode(attribute.attacl) acl
      WHERE attribute.attrelid = format('app_private.%I', column_grant.table_name)::regclass
        AND acl.grantee = column_grant.grantee_oid
    ) granted_column;
    grantee_sql := CASE
      WHEN column_grant.grantee_name = 'PUBLIC' THEN 'PUBLIC'
      ELSE format('%I', column_grant.grantee_name)
    END;
    EXECUTE format(
      'REVOKE ALL PRIVILEGES (%s) ON TABLE app_private.%I FROM %s',
      column_list,
      column_grant.table_name,
      grantee_sql
    );
  END LOOP;
END
$$;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC, app_runtime;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC, app_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app_private FROM PUBLIC, app_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC, app_runtime;
GRANT USAGE ON SCHEMA app_private TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  app_private."user", app_private.session, app_private.account,
  app_private.verification, app_private.cart_items,
  app_private.wishlist
TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON
  app_private.products_items, app_private.products_variants
TO app_runtime;
GRANT SELECT, INSERT ON app_private.checkout_intents TO app_runtime;
CREATE OR REPLACE FUNCTION app_private.bind_checkout_intent(
  p_user_id text,
  p_intent_id text,
  p_checkout_session_id text
)
RETURNS SETOF app_private.checkout_intents
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, app_private
AS $function$
  UPDATE app_private.checkout_intents AS intent
  SET checkout_session_id = p_checkout_session_id
  WHERE intent.id = p_intent_id
    AND intent.user_id = p_user_id
    AND (
      intent.checkout_session_id IS NULL
      OR intent.checkout_session_id = p_checkout_session_id
    )
  RETURNING intent.*
$function$;
ALTER FUNCTION app_private.bind_checkout_intent(text, text, text)
  OWNER TO app_owner;
REVOKE ALL ON FUNCTION app_private.bind_checkout_intent(text, text, text)
  FROM PUBLIC, app_runtime;
GRANT EXECUTE ON FUNCTION app_private.bind_checkout_intent(text, text, text)
  TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON app_private.catalog_sync_operations TO app_runtime;
GRANT INSERT ON app_private.catalog_sync_replay_audit TO app_runtime;
GRANT SELECT, INSERT ON
  app_private.order_items, app_private.customer_info,
  app_private.order_products
TO app_runtime;
GRANT INSERT ON app_private.stripe_event_receipts TO app_runtime;
GRANT SELECT (event_id) ON app_private.stripe_event_receipts TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON
  app_private.fulfillment_work, app_private.fulfillment_effects
TO app_runtime;
GRANT INSERT ON app_private.fulfillment_replay_audit TO app_runtime;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app_private TO app_runtime;

COMMIT;
