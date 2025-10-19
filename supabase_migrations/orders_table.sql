-- ========================================
-- ORDERS TABLE (User Orders)
-- ========================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_date TIMESTAMPTZ NOT NULL,
  order_number BIGINT NOT NULL UNIQUE,
  customer_info JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES for performance optimization
-- ========================================

-- Index to search orders by user (most frequent query)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Index to search by order number
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Index to sort by creation date
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Index to sort by delivery date
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date DESC);

-- Composite index for user and creation date
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on the table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own orders
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own orders
CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own orders
CREATE POLICY "Users can delete their own orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TRIGGER to automatically update updated_at
-- ========================================

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that executes the function before each UPDATE
CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- ========================================
-- COMMENTS (Database documentation)
-- ========================================

COMMENT ON TABLE orders IS 'Stores customer orders with delivery and billing information';
COMMENT ON COLUMN orders.id IS 'Unique identifier for the order';
COMMENT ON COLUMN orders.user_id IS 'User ID who placed the order (references auth.users)';
COMMENT ON COLUMN orders.delivery_date IS 'Expected delivery date for the order';
COMMENT ON COLUMN orders.order_number IS 'Sequential order number for reference';
COMMENT ON COLUMN orders.customer_info IS 'JSONB object containing customer name, email, address, and payment info';
COMMENT ON COLUMN orders.created_at IS 'Order creation date and time';
COMMENT ON COLUMN orders.updated_at IS 'Last update date and time (automatically updated)';
