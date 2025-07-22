-- database_migrations/003_tariffs_setup.sql

-- Creates the tariffs table and seeds it with initial data.
-- This script is designed to be idempotent and can be run multiple times safely.

-- 1. Create the tariffs table if it does not exist
CREATE TABLE IF NOT EXISTS public.tariffs (
    customer_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    tiers JSONB NOT NULL,
    maintenance_percentage REAL NOT NULL DEFAULT 0.01,
    sanitation_percentage REAL NOT NULL DEFAULT 0.07,
    sewerage_rate_per_m3 REAL NOT NULL DEFAULT 1.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_type, year)
);

-- 2. Create a trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop the trigger if it exists to ensure it can be re-added without error
DROP TRIGGER IF EXISTS set_timestamp ON public.tariffs;

-- 4. Create the trigger to call the function before any update
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.tariffs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 5. Enable Row Level Security (RLS) on the tariffs table
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing RLS policies to redefine them, ensuring they are up-to-date
DROP POLICY IF EXISTS "Allow public read access to tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Allow admin update access to tariffs" ON public.tariffs;

-- 7. Create policy for public read access
CREATE POLICY "Allow public read access to tariffs"
ON public.tariffs
FOR SELECT
USING (true);

-- 8. Create policy to allow admins to update tariffs
CREATE POLICY "Allow admin update access to tariffs"
ON public.tariffs
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9. Seed the table with corrected tariff data for multiple years (2021-2025)
-- This block uses INSERT ... ON CONFLICT to either insert new data or update existing rows if the year/type combo exists.
DO $$
DECLARE
    domestic_tiers_2021_2023 JSONB := '[
        {"limit": 5, "rate": 5.50},
        {"limit": 10, "rate": 6.75},
        {"limit": 14, "rate": 9.00},
        {"limit": 23, "rate": 10.50},
        {"limit": 38, "rate": 12.00},
        {"limit": 50, "rate": 13.50},
        {"limit": "Infinity", "rate": 15.00}
    ]';
    
    domestic_tiers_2024_onward JSONB := '[
        {"limit": 7, "rate": 10.00},
        {"limit": 20, "rate": 12.00},
        {"limit": 35, "rate": 15.00},
        {"limit": 50, "rate": 18.00},
        {"limit": "Infinity", "rate": 20.00}
    ]';
    
    nondomestic_tiers JSONB := '[
        {"limit": 15, "rate": 10.21},
        {"limit": 50, "rate": 17.87},
        {"limit": 100, "rate": 33.19},
        {"limit": 300, "rate": 51.07},
        {"limit": 500, "rate": 61.28},
        {"limit": 1000, "rate": 71.49},
        {"limit": "Infinity", "rate": 81.71}
    ]';

    years INT[] := ARRAY[2021, 2022, 2023, 2024, 2025];
    y INT;
BEGIN
    FOREACH y IN ARRAY years
    LOOP
        -- Insert/Update Domestic tariffs
        INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3)
        VALUES (
            'Domestic', 
            y, 
            CASE WHEN y >= 2024 THEN domestic_tiers_2024_onward ELSE domestic_tiers_2021_2023 END,
            0.07, -- 7% sanitation fee for Domestic
            1.50
        )
        ON CONFLICT (customer_type, year) 
        DO UPDATE SET 
            tiers = EXCLUDED.tiers,
            sanitation_percentage = EXCLUDED.sanitation_percentage,
            sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3;

        -- Insert/Update Non-domestic tariffs
        INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3)
        VALUES (
            'Non-domestic', 
            y, 
            nondomestic_tiers,
            0.10, -- 10% sanitation fee for Non-domestic
            3.00
        )
        ON CONFLICT (customer_type, year) 
        DO UPDATE SET 
            tiers = EXCLUDED.tiers,
            sanitation_percentage = EXCLUDED.sanitation_percentage,
            sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3;
    END LOOP;
END;
$$;
