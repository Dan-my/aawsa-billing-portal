-- Migration to add tiered sewerage fees for domestic customers.

-- 1. Add the new 'sewerage_tiers' column to the tariffs table.
-- This column will store the array of tiers as JSONB.
ALTER TABLE public.tariffs
ADD COLUMN IF NOT EXISTS sewerage_tiers JSONB;

-- 2. Populate the new 'sewerage_tiers' column for existing "Domestic" tariffs.
-- This script creates a default two-tier structure using the existing 'sewerage_rate_per_m3' value.
-- This ensures that billing calculations continue to work for existing domestic tariffs
-- until the new tiered rates are manually configured in the admin panel.
-- Tier 1: 1-5 m³
-- Tier 2: Above 5 m³
UPDATE public.tariffs
SET 
  sewerage_tiers = jsonb_build_array(
    jsonb_build_object('rate', sewerage_rate_per_m3, 'limit', 5),
    jsonb_build_object('rate', sewerage_rate_per_m3, 'limit', 'Infinity')
  )
WHERE 
  customer_type = 'Domestic' 
  AND (sewerage_tiers IS NULL OR sewerage_tiers::text = 'null' OR sewerage_tiers::text = '[]');

-- Note: The 'sewerage_rate_per_m3' column is intentionally kept, as it is still
-- used for the single-rate calculation for "Non-domestic" customers.
