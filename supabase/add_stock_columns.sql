-- Stock management columns
-- Run this in Supabase SQL editor

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_variants jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS erp_sku        text;

-- Index for ERP sync lookups by SKU
CREATE INDEX IF NOT EXISTS idx_products_erp_sku ON products (erp_sku) WHERE erp_sku IS NOT NULL;

-- stock_variants JSONB format:
--   Key:   "{flavor}|{size}"  (if both),  "{flavor}"  (only flavors),  "{size}"  (only sizes)
--   Value: { "qty": 15, "sku": "ON-GSW-CHOC-1KG" }
--
-- Example:
--   {
--     "Chocolate|1kg":  { "qty": 25, "sku": "ON-GSW-CH-1KG" },
--     "Vanilla|2kg":    { "qty":  8, "sku": "ON-GSW-VA-2KG" },
--     "Unflavored|908g":{ "qty":  0, "sku": "ON-GSW-UF-908G" }
--   }
--
-- Products with no variants use the simple `stock` integer column.
--
-- ERP sync endpoint (future):
--   PATCH /api/erp-sync  { sku: "ON-GSW-CH-1KG", qty: 32 }
--   → Updates stock_variants entry where sku matches across all products
