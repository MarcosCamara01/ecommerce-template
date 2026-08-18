DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user') THEN
    ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Backend can manage auth users" ON public."user";
    DROP POLICY IF EXISTS "Users can view own profile" ON public."user";
    DROP POLICY IF EXISTS "Users can update own profile" ON public."user";

    CREATE POLICY "Backend can manage auth users"
      ON public."user"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);

    CREATE POLICY "Users can view own profile"
      ON public."user"
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (app.current_user_id() = id);

    CREATE POLICY "Users can update own profile"
      ON public."user"
      AS PERMISSIVE
      FOR UPDATE
      TO public
      USING (app.current_user_id() = id)
      WITH CHECK (app.current_user_id() = id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_items') THEN
    ALTER TABLE public.products_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view products" ON public.products_items;

    CREATE POLICY "Anyone can view products"
      ON public.products_items
      AS PERMISSIVE
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_variants') THEN
    ALTER TABLE public.products_variants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view variants" ON public.products_variants;

    CREATE POLICY "Anyone can view variants"
      ON public.products_variants
      AS PERMISSIVE
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
    ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
    DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
    DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
    DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

    CREATE POLICY "Users can view own cart items"
      ON public.cart_items
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (app.current_user_id() = user_id);

    CREATE POLICY "Users can insert own cart items"
      ON public.cart_items
      AS PERMISSIVE
      FOR INSERT
      TO public
      WITH CHECK (app.current_user_id() = user_id);

    CREATE POLICY "Users can update own cart items"
      ON public.cart_items
      AS PERMISSIVE
      FOR UPDATE
      TO public
      USING (app.current_user_id() = user_id)
      WITH CHECK (app.current_user_id() = user_id);

    CREATE POLICY "Users can delete own cart items"
      ON public.cart_items
      AS PERMISSIVE
      FOR DELETE
      TO public
      USING (app.current_user_id() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlist') THEN
    ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own wishlist items" ON public.wishlist;
    DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist;
    DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist;

    CREATE POLICY "Users can view own wishlist items"
      ON public.wishlist
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (app.current_user_id() = user_id);

    CREATE POLICY "Users can insert own wishlist items"
      ON public.wishlist
      AS PERMISSIVE
      FOR INSERT
      TO public
      WITH CHECK (app.current_user_id() = user_id);

    CREATE POLICY "Users can delete own wishlist items"
      ON public.wishlist
      AS PERMISSIVE
      FOR DELETE
      TO public
      USING (app.current_user_id() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow all order operations" ON public.order_items;
    DROP POLICY IF EXISTS "Users can view own orders" ON public.order_items;

    CREATE POLICY "Users can view own orders"
      ON public.order_items
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (app.current_user_id() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_info') THEN
    ALTER TABLE public.customer_info ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow all customer info operations" ON public.customer_info;
    DROP POLICY IF EXISTS "Users can view own customer info" ON public.customer_info;

    CREATE POLICY "Users can view own customer info"
      ON public.customer_info
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (
        EXISTS (
          SELECT 1
          FROM public.order_items
          WHERE public.order_items.id = customer_info.order_id
            AND public.order_items.user_id = app.current_user_id()
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_products') THEN
    ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow all order products operations" ON public.order_products;
    DROP POLICY IF EXISTS "Users can view own order products" ON public.order_products;

    CREATE POLICY "Users can view own order products"
      ON public.order_products
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (
        EXISTS (
          SELECT 1
          FROM public.order_items
          WHERE public.order_items.id = order_products.order_id
            AND public.order_items.user_id = app.current_user_id()
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session') THEN
    ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Deny direct API access to auth sessions" ON public.session;
    DROP POLICY IF EXISTS "Backend can manage auth sessions" ON public.session;

    CREATE POLICY "Backend can manage auth sessions"
      ON public.session
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account') THEN
    ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Deny direct API access to auth accounts" ON public.account;
    DROP POLICY IF EXISTS "Backend can manage auth accounts" ON public.account;

    CREATE POLICY "Backend can manage auth accounts"
      ON public.account
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'verification') THEN
    ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Deny direct API access to auth verifications" ON public.verification;
    DROP POLICY IF EXISTS "Backend can manage auth verifications" ON public.verification;

    CREATE POLICY "Backend can manage auth verifications"
      ON public.verification
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);
  END IF;
END
$$;
