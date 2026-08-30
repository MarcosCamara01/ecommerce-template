-- Representative public-schema database from before the private-schema cutover.
-- Keep the legacy CASCADE action and at least one pre-existing named index: the
-- integration test relies on both to exercise the conversion rather than a
-- fresh-schema migration.
-- The integration harness replaces the credential-hash marker with a
-- deterministic runtime-generated scrypt value so no credential-like hash is
-- committed as a scanner trigger.

CREATE SCHEMA app;
CREATE FUNCTION app.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::text
$$;

CREATE TYPE public.product_category AS ENUM (
  't-shirts', 'pants', 'sweatshirts'
);
CREATE TYPE public.sizes AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');

CREATE TABLE public."user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_email_unique UNIQUE (email)
);

CREATE TABLE public.account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES public."user"(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE public.session (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id text NOT NULL,
  CONSTRAINT session_token_unique UNIQUE (token),
  CONSTRAINT session_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES public."user"(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE public.verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products_items (
  id bigserial PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text NOT NULL,
  price numeric(10, 2) NOT NULL,
  category public.product_category NOT NULL,
  img varchar(500) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT price_positive CHECK (price > 0)
);

CREATE TABLE public.products_variants (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL,
  stripe_id varchar(255) NOT NULL,
  color varchar(100) NOT NULL,
  sizes public.sizes[] NOT NULL,
  images text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT products_variants_stripe_id_unique UNIQUE (stripe_id),
  CONSTRAINT product_color_unique UNIQUE (product_id, color),
  CONSTRAINT products_variants_product_id_products_items_id_fk
    FOREIGN KEY (product_id) REFERENCES public.products_items(id)
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE public.cart_items (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  variant_id bigint NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  size public.sizes NOT NULL,
  stripe_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cart_user_variant_size_unique
    UNIQUE (user_id, variant_id, size),
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT cart_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT cart_items_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES public.products_variants(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public.wishlist (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  product_id bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wishlist_user_product_unique UNIQUE (user_id, product_id),
  CONSTRAINT wishlist_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT wishlist_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public.order_items (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  delivery_date timestamptz NOT NULL,
  order_number bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT order_items_order_number_unique UNIQUE (order_number),
  CONSTRAINT order_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public.customer_info (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address jsonb NOT NULL,
  stripe_order_id text NOT NULL,
  total_price bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customer_info_order_id_unique UNIQUE (order_id),
  CONSTRAINT customer_info_stripe_order_id_unique UNIQUE (stripe_order_id),
  CONSTRAINT customer_info_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.order_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public.order_products (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL,
  variant_id bigint NOT NULL,
  quantity integer NOT NULL,
  size text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT order_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_products_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.order_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT order_products_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES public.products_variants(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- This exact legacy index makes PostgreSQL expose the inspected columns as
-- name[], while the cutover contract describes them as text[].
CREATE INDEX idx_order_items_user_id ON public.order_items (user_id);

INSERT INTO public."user" (
  id, name, email, email_verified, image, created_at, updated_at
) VALUES (
  'legacy-rehearsal-user',
  'Legacy Rehearsal',
  'legacy-rehearsal@example.test',
  true,
  'https://example.test/legacy-avatar.webp',
  '2026-01-01 00:00:01+00',
  '2026-01-01 00:00:02+00'
);
INSERT INTO public.account (
  id, account_id, provider_id, user_id,
  access_token, refresh_token, id_token,
  access_token_expires_at, refresh_token_expires_at,
  scope, password, created_at, updated_at
) VALUES (
  'legacy-account',
  'legacy-rehearsal@example.test',
  'credential',
  'legacy-rehearsal-user',
  'synthetic-access-token',
  'synthetic-refresh-token',
  'synthetic-id-token',
  '2027-01-01 00:00:03+00',
  '2027-01-01 00:00:04+00',
  'openid profile email',
  '__CUTOVER_CREDENTIAL_HASH__',
  '2026-01-01 00:00:05+00',
  '2026-01-01 00:00:06+00'
);
INSERT INTO public.session (
  id, expires_at, token, created_at, updated_at,
  ip_address, user_agent, user_id
) VALUES (
  'legacy-session',
  '2027-01-01 00:00:07+00',
  'legacy-session-token',
  '2026-01-01 00:00:08+00',
  '2026-01-01 00:00:09+00',
  '192.0.2.10',
  'cutover-rehearsal-agent',
  'legacy-rehearsal-user'
);
INSERT INTO public.verification (
  id, identifier, value, expires_at, created_at, updated_at
) VALUES (
  'legacy-verification',
  'legacy-rehearsal@example.test',
  'synthetic-verification',
  '2027-01-01 00:00:10+00',
  '2026-01-01 00:00:11+00',
  '2026-01-01 00:00:12+00'
);
INSERT INTO public.products_items (
  name, description, price, category, img
) VALUES (
  'Legacy Rehearsal Product',
  'Historical cutover sentinel',
  42.50,
  't-shirts',
  'https://example.test/legacy-rehearsal.webp'
);
INSERT INTO public.products_variants (
  product_id, stripe_id, color, sizes, images
)
SELECT
  id,
  'price_legacy_rehearsal',
  'Black',
  ARRAY['M']::public.sizes[],
  ARRAY['https://example.test/legacy-rehearsal.webp']::text[]
FROM public.products_items
WHERE name = 'Legacy Rehearsal Product';
INSERT INTO public.cart_items (
  user_id, variant_id, quantity, size, stripe_id
)
SELECT 'legacy-rehearsal-user', id, 2, 'M', stripe_id
FROM public.products_variants
WHERE stripe_id = 'price_legacy_rehearsal';
INSERT INTO public.wishlist (user_id, product_id)
SELECT 'legacy-rehearsal-user', id
FROM public.products_items
WHERE name = 'Legacy Rehearsal Product';
INSERT INTO public.order_items (user_id, delivery_date, order_number) VALUES (
  'legacy-rehearsal-user',
  now() + interval '3 days',
  2026083001
);
INSERT INTO public.customer_info (
  order_id, name, email, phone, address, stripe_order_id, total_price
)
SELECT
  id,
  'Legacy Rehearsal',
  'legacy-rehearsal@example.test',
  '+34000000000',
  '{"line1":"QA Street 1","city":"Madrid","postal_code":"28001","country":"ES"}'::jsonb,
  'cs_test_legacy_rehearsal',
  8500
FROM public.order_items
WHERE order_number = 2026083001;
INSERT INTO public.order_products (order_id, variant_id, quantity, size)
SELECT orders.id, variants.id, 2, 'M'
FROM public.order_items orders
CROSS JOIN public.products_variants variants
WHERE orders.order_number = 2026083001
  AND variants.stripe_id = 'price_legacy_rehearsal';

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification', 'products_items',
    'products_variants', 'cart_items', 'wishlist', 'order_items',
    'customer_info', 'order_products'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO PUBLIC ' ||
      'USING (current_setting(''request.jwt.claim.role'', true) IS NULL) ' ||
      'WITH CHECK (current_setting(''request.jwt.claim.role'', true) IS NULL)',
      'Legacy backend access',
      table_name
    );
  END LOOP;
END
$$;
