DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_items') THEN
    ALTER TABLE public.products_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products_items;
    DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products_items;
    DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products_items;
    DROP POLICY IF EXISTS "Backend can manage products" ON public.products_items;
    DROP POLICY IF EXISTS "Anyone can view products" ON public.products_items;

    CREATE POLICY "Backend can manage products"
      ON public.products_items
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);

    CREATE POLICY "Anyone can view products"
      ON public.products_items
      AS PERMISSIVE
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_variants') THEN
    ALTER TABLE public.products_variants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can insert variants" ON public.products_variants;
    DROP POLICY IF EXISTS "Authenticated users can update variants" ON public.products_variants;
    DROP POLICY IF EXISTS "Authenticated users can delete variants" ON public.products_variants;
    DROP POLICY IF EXISTS "Backend can manage variants" ON public.products_variants;
    DROP POLICY IF EXISTS "Anyone can view variants" ON public.products_variants;

    CREATE POLICY "Backend can manage variants"
      ON public.products_variants
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);

    CREATE POLICY "Anyone can view variants"
      ON public.products_variants
      AS PERMISSIVE
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage orders" ON public.order_items;
    DROP POLICY IF EXISTS "Backend can manage orders" ON public.order_items;
    DROP POLICY IF EXISTS "Users can view own orders" ON public.order_items;

    CREATE POLICY "Backend can manage orders"
      ON public.order_items
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);

    CREATE POLICY "Users can view own orders"
      ON public.order_items
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (app.current_user_id() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_info') THEN
    ALTER TABLE public.customer_info ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage customer info" ON public.customer_info;
    DROP POLICY IF EXISTS "Backend can manage customer info" ON public.customer_info;
    DROP POLICY IF EXISTS "Users can view own customer info" ON public.customer_info;

    CREATE POLICY "Backend can manage customer info"
      ON public.customer_info
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);

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

    DROP POLICY IF EXISTS "Service role can manage order products" ON public.order_products;
    DROP POLICY IF EXISTS "Backend can manage order products" ON public.order_products;
    DROP POLICY IF EXISTS "Users can view own order products" ON public.order_products;

    CREATE POLICY "Backend can manage order products"
      ON public.order_products
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (current_setting('request.jwt.claim.role', true) IS NULL)
      WITH CHECK (current_setting('request.jwt.claim.role', true) IS NULL);

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
END
$$;
