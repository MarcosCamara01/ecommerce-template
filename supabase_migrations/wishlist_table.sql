-- ========================================
-- WISHLIST TABLE (User's Wish List)
-- ========================================

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint to avoid duplicates: a user cannot have the same product twice in their wishlist
  UNIQUE(user_id, product_id)
);

-- ========================================
-- INDEXES for performance optimization
-- ========================================

-- Index to search items by user (most frequent query)
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- Index to search by product_id
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- Index to sort by update date
CREATE INDEX IF NOT EXISTS idx_wishlist_updated_at ON wishlist(updated_at DESC);

-- Composite index for specific item searches
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON wishlist(user_id, product_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on the table
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own wishlist items
CREATE POLICY "Users can view their own wishlist items"
  ON wishlist FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert items into their own wishlist
CREATE POLICY "Users can insert their own wishlist items"
  ON wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own wishlist items
CREATE POLICY "Users can delete their own wishlist items"
  ON wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TRIGGER to automatically update updated_at
-- ========================================

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that executes the function before each UPDATE
CREATE TRIGGER update_wishlist_updated_at_trigger
  BEFORE UPDATE ON wishlist
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_updated_at();

-- ========================================
-- COMMENTS (Database documentation)
-- ========================================

COMMENT ON TABLE wishlist IS 'Stores wishlist items for each user';
COMMENT ON COLUMN wishlist.id IS 'Unique identifier for the wishlist item';
COMMENT ON COLUMN wishlist.user_id IS 'User ID who owns the item (references auth.users)';
COMMENT ON COLUMN wishlist.product_id IS 'Product ID that the user wants to save';
COMMENT ON COLUMN wishlist.created_at IS 'Item creation date and time';
COMMENT ON COLUMN wishlist.updated_at IS 'Last update date and time (automatically updated)';
