-- ========================================
-- ENUM TYPES
-- ========================================

-- Create sizes enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE sizes AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- CART_ITEMS TABLE (Shopping Cart)
-- ========================================

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  variant_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size sizes NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint to avoid duplicates: a user cannot have the same variant_id with the same size twice
  UNIQUE(user_id, variant_id, size)
);

-- ========================================
-- INDEXES for performance optimization
-- ========================================

-- Index to search items by user (most frequent query)
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart_items(user_id);

-- Index to search by variant_id
CREATE INDEX IF NOT EXISTS idx_cart_variant_id ON cart_items(variant_id);

-- Index to sort by update date
CREATE INDEX IF NOT EXISTS idx_cart_updated_at ON cart_items(updated_at DESC);

-- Composite index for specific item searches
CREATE INDEX IF NOT EXISTS idx_cart_user_variant_size ON cart_items(user_id, variant_id, size);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on the table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own cart items
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can only insert items into their own cart
CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can only update their own cart items
CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can only delete their own cart items
CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid()::text = user_id);

-- ========================================
-- TRIGGER to automatically update updated_at
-- ========================================

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that executes the function before each UPDATE
CREATE TRIGGER update_cart_items_updated_at_trigger
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- ========================================
-- COMMENTS (Database documentation)
-- ========================================

COMMENT ON TABLE cart_items IS 'Stores shopping cart items for each user';
COMMENT ON COLUMN cart_items.id IS 'Unique identifier for the cart item';
COMMENT ON COLUMN cart_items.user_id IS 'User ID who owns the item (references auth.users)';
COMMENT ON COLUMN cart_items.variant_id IS 'Product variant ID';
COMMENT ON COLUMN cart_items.quantity IS 'Quantity of items (must be greater than 0)';
COMMENT ON COLUMN cart_items.size IS 'Product size (using sizes enum type)';
COMMENT ON COLUMN cart_items.created_at IS 'Item creation date and time';
COMMENT ON COLUMN cart_items.updated_at IS 'Last update date and time (automatically updated)';

