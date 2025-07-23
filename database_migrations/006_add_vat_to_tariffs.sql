-- This script adds VAT-related columns to the tariffs table
-- and populates them with default values for existing records.

-- Add vat_rate column with a default of 15% (0.15)
ALTER TABLE public.tariffs
ADD COLUMN IF NOT EXISTS vat_rate real NOT NULL DEFAULT 0.15;

-- Add domestic_vat_threshold_m3 column with a default of 15 m³
ALTER TABLE public.tariffs
ADD COLUMN IF NOT EXISTS domestic_vat_threshold_m3 integer NOT NULL DEFAULT 15;

-- The following DO block ensures that any existing tariff records
-- are updated with the new default values if the columns were just added.
-- This is safe to run multiple times.
DO $$
BEGIN
    -- For any existing rows where vat_rate might be null (if added without default), set it.
    UPDATE public.tariffs
    SET vat_rate = 0.15
    WHERE vat_rate IS NULL;

    -- For any existing rows where domestic_vat_threshold_m3 might be null, set it.
    UPDATE public.tariffs
    SET domestic_vat_threshold_m3 = 15
    WHERE domestic_vat_threshold_m3 IS NULL;
END $$;
