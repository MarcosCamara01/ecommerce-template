-- ========================================
-- COMPLETE ORDERS STRUCTURE
-- This replaces the basic orders table with a complete structure
-- ========================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS order_products CASCADE;
DROP TABLE IF EXISTS customer_info CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;

-- ========================================
-- ORDER ITEMS TABLE (Main order table)
-- ========================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  delivery_date TIMESTAMPTZ NOT NULL,
  order_number BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CUSTOMER INFO TABLE (One-to-one with order_items)
-- ========================================
CREATE TABLE IF NOT EXISTS customer_info (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address JSONB NOT NULL,
  stripe_order_id TEXT NOT NULL,
  total_price BIGINT NOT NULL, -- Amount in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ORDER PRODUCTS TABLE (Many-to-one with order_items)
-- ========================================
CREATE TABLE IF NOT EXISTS order_products (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  variant_id BIGINT NOT NULL REFERENCES products_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES for performance optimization
-- ========================================

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_number ON order_items(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_delivery_date ON order_items(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_user_created ON order_items(user_id, created_at DESC);

-- Customer info indexes
CREATE INDEX IF NOT EXISTS idx_customer_info_order_id ON customer_info(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_info_stripe_order_id ON customer_info(stripe_order_id);
CREATE INDEX IF NOT EXISTS idx_customer_info_email ON customer_info(email);

-- Order products indexes
CREATE INDEX IF NOT EXISTS idx_order_products_order_id ON order_products(order_id);
CREATE INDEX IF NOT EXISTS idx_order_products_variant_id ON order_products(variant_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;

-- Order Items Policies
-- Note: Using Better Auth, not Supabase Auth, so we allow service role access
-- Security is handled in application code by filtering with user_id
CREATE POLICY "Service role can manage orders"
  ON order_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Customer Info Policies
-- Service role access for Better Auth
CREATE POLICY "Service role can manage customer info"
  ON customer_info FOR ALL
  USING (true)
  WITH CHECK (true);

-- Order Products Policies
-- Service role access for Better Auth
CREATE POLICY "Service role can manage order products"
  ON order_products FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- TRIGGERS to automatically update updated_at
-- ========================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_info_updated_at
  BEFORE UPDATE ON customer_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_products_updated_at
  BEFORE UPDATE ON order_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMMENTS (Database documentation)
-- ========================================

COMMENT ON TABLE order_items IS 'Main orders table storing basic order information';
COMMENT ON TABLE customer_info IS 'Customer and payment information for each order';
COMMENT ON TABLE order_products IS 'Products included in each order with quantities and sizes';

