-- Create the tariffs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tariffs (
    customer_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    tiers JSONB NOT NULL,
    maintenance_percentage NUMERIC(5, 4) NOT NULL,
    sanitation_percentage NUMERIC(5, 4) NOT NULL,
    sewerage_rate_per_m3 NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (customer_type, year)
);

-- Apply Row-Level Security (RLS)
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
DROP POLICY IF EXISTS "allow_public_read_on_tariffs" ON public.tariffs;
CREATE POLICY "allow_public_read_on_tariffs" ON public.tariffs
FOR SELECT USING (true);

-- Allow admins to insert, update, and delete
DROP POLICY IF EXISTS "allow_admin_all_on_tariffs" ON public.tariffs;
CREATE POLICY "allow_admin_all_on_tariffs" ON public.tariffs
FOR ALL
USING ((SELECT public.is_admin()) = true)
WITH CHECK ((SELECT public.is_admin()) = true);


-- Seed the data for Domestic tariffs for the year 2023
-- This uses the corrected rates based on the provided image.
INSERT INTO public.tariffs (
    customer_type,
    year,
    tiers,
    maintenance_percentage,
    sanitation_percentage,
    sewerage_rate_per_m3
) VALUES (
    'Domestic',
    2023,
    '[
        {"rate": 10.21, "limit": 5},
        {"rate": 17.87, "limit": 14},
        {"rate": 33.19, "limit": 24},
        {"rate": 51.07, "limit": 39},
        {"rate": 61.28, "limit": 54},
        {"rate": 71.49, "limit": 79},
        {"rate": 81.71, "limit": Infinity}
    ]'::jsonb,
    0.01, -- 1%
    0.07, -- 7%
    6.25
)
ON CONFLICT (customer_type, year) DO UPDATE SET
tiers = EXCLUDED.tiers,
maintenance_percentage = EXCLUDED.maintenance_percentage,
sanitation_percentage = EXCLUDED.sanitation_percentage,
sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3,
updated_at = now();


-- Seed the data for Non-domestic tariffs for the year 2023
-- This also uses the corrected rates, as non-domestic often mirrors domestic.
INSERT INTO public.tariffs (
    customer_type,
    year,
    tiers,
    maintenance_percentage,
    sanitation_percentage,
    sewerage_rate_per_m3
) VALUES (
    'Non-domestic',
    2023,
    '[
        {"rate": 10.21, "limit": 5},
        {"rate": 17.87, "limit": 14},
        {"rate": 33.19, "limit": 24},
        {"rate": 51.07, "limit": 39},
        {"rate": 61.28, "limit": 54},
        {"rate": 71.49, "limit": 79},
        {"rate": 81.71, "limit": Infinity}
    ]'::jsonb,
    0.01, -- 1%
    0.10, -- 10%
    8.75
)
ON CONFLICT (customer_type, year) DO UPDATE SET
tiers = EXCLUDED.tiers,
maintenance_percentage = EXCLUDED.maintenance_percentage,
sanitation_percentage = EXCLUDED.sanitation_percentage,
sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3,
updated_at = now();

-- Trigger to automatically update the `updated_at` column
CREATE OR REPLACE TRIGGER set_tariffs_updated_at
BEFORE UPDATE ON public.tariffs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
