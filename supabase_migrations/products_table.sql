-- ========================================
-- ENUM TYPES
-- ========================================

-- Create product_category enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM ('t-shirts', 'pants', 'sweatshirt');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- PRODUCTS_ITEMS TABLE (Products)
-- ========================================

-- Create products_items table
CREATE TABLE IF NOT EXISTS products_items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  category product_category NOT NULL,
  img VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES for performance optimization
-- ========================================

-- Index to search by category
CREATE INDEX IF NOT EXISTS idx_products_category ON products_items(category);

-- Index to search by name (for search functionality)
CREATE INDEX IF NOT EXISTS idx_products_name ON products_items(name);

-- Index to sort by creation date
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products_items(created_at DESC);

-- Index to sort by update date
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products_items(updated_at DESC);

-- ========================================
-- TRIGGER to automatically update updated_at
-- ========================================

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_products_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that executes the function before each UPDATE
CREATE TRIGGER update_products_items_updated_at_trigger
  BEFORE UPDATE ON products_items
  FOR EACH ROW
  EXECUTE FUNCTION update_products_items_updated_at();

-- ========================================
-- COMMENTS (Database documentation)
-- ========================================

COMMENT ON TABLE products_items IS 'Stores all products in the ecommerce store';
COMMENT ON COLUMN products_items.id IS 'Unique identifier for the product';
COMMENT ON COLUMN products_items.name IS 'Product name';
COMMENT ON COLUMN products_items.description IS 'Detailed product description';
COMMENT ON COLUMN products_items.price IS 'Product price (must be greater than 0)';
COMMENT ON COLUMN products_items.category IS 'Product category (t-shirts, pants, sweatshirt)';
COMMENT ON COLUMN products_items.img IS 'URL to the main product image';
COMMENT ON COLUMN products_items.created_at IS 'Product creation date and time';
COMMENT ON COLUMN products_items.updated_at IS 'Last update date and time (automatically updated)';
