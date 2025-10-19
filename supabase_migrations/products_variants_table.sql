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
-- PRODUCTS_VARIANTS TABLE (Product Variants)
-- ========================================

-- Create products_variants table
CREATE TABLE IF NOT EXISTS products_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products_items(id) ON DELETE CASCADE,
  stripe_id VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(100) NOT NULL,
  sizes sizes[] NOT NULL,
  images TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint to avoid duplicates: a product cannot have the same color twice
  UNIQUE(product_id, color)
);

-- ========================================
-- INDEXES for performance optimization
-- ========================================

-- Index to search variants by product
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON products_variants(product_id);

-- Index to search by stripe_id
CREATE INDEX IF NOT EXISTS idx_variants_stripe_id ON products_variants(stripe_id);

-- Index to search by color
CREATE INDEX IF NOT EXISTS idx_variants_color ON products_variants(color);

-- Index to sort by creation date
CREATE INDEX IF NOT EXISTS idx_variants_created_at ON products_variants(created_at DESC);

-- Index to sort by update date
CREATE INDEX IF NOT EXISTS idx_variants_updated_at ON products_variants(updated_at DESC);

-- ========================================
-- TRIGGER to automatically update updated_at
-- ========================================

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_products_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that executes the function before each UPDATE
CREATE TRIGGER update_products_variants_updated_at_trigger
  BEFORE UPDATE ON products_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_products_variants_updated_at();

-- ========================================
-- COMMENTS (Database documentation)
-- ========================================

COMMENT ON TABLE products_variants IS 'Stores product variants (color variations) with sizes and images';
COMMENT ON COLUMN products_variants.id IS 'Unique identifier for the product variant';
COMMENT ON COLUMN products_variants.product_id IS 'Reference to the product (references products_items)';
COMMENT ON COLUMN products_variants.stripe_id IS 'Stripe product ID for payment processing';
COMMENT ON COLUMN products_variants.color IS 'Color name of the variant';
COMMENT ON COLUMN products_variants.sizes IS 'Array of available sizes for this variant';
COMMENT ON COLUMN products_variants.images IS 'Array of image URLs for this variant';
COMMENT ON COLUMN products_variants.created_at IS 'Variant creation date and time';
COMMENT ON COLUMN products_variants.updated_at IS 'Last update date and time (automatically updated)';
