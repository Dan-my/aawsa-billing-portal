-- Drop existing table and type if they exist to ensure a clean setup
DROP TABLE IF EXISTS public.tariffs;
DROP TYPE IF EXISTS public.customer_category;

-- Create a custom type for customer categories for type safety
CREATE TYPE public.customer_category AS ENUM ('Domestic', 'Non-domestic');

-- Create the tariffs table
CREATE TABLE public.tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type public.customer_category NOT NULL,
    year INT NOT NULL,
    tiers JSONB NOT NULL,
    maintenance_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.01, -- e.g., 0.01 for 1%
    sanitation_percentage NUMERIC(5, 4) NOT NULL,
    sewerage_rate_per_m3 NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_tariff_year_type UNIQUE (customer_type, year)
);

-- Enable Row-Level Security
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
CREATE POLICY "Allow public read access to tariffs"
ON public.tariffs
FOR SELECT
TO public
USING (true);

-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access to tariffs"
ON public.tariffs
FOR ALL
TO authenticated
USING ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin');


-- Function to seed data for a given year
CREATE OR REPLACE FUNCTION seed_tariffs_for_year(p_year INT)
RETURNS void AS $$
BEGIN
    -- Domestic Tariff for the specified year
    INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3)
    VALUES (
        'Domestic',
        p_year,
        '[
            {"rate": 10.21, "limit": 5},
            {"rate": 17.87, "limit": 14},
            {"rate": 21.87, "limit": 30},
            {"rate": 24.37, "limit": 50},
            {"rate": 26.87, "limit": "Infinity"}
        ]'::JSONB,
        0.07, -- 7% sanitation fee for Domestic
        6.25  -- Sewerage rate per m³
    )
    ON CONFLICT (customer_type, year) DO NOTHING;

    -- Non-domestic Tariff for the specified year
    INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3)
    VALUES (
        'Non-domestic',
        p_year,
        '[
            {"rate": 25.62, "limit": 15},
            {"rate": 25.62, "limit": "Infinity"}
        ]'::JSONB,
        0.10, -- 10% sanitation fee for Non-domestic
        8.50  -- Sewerage rate per m³
    )
    ON CONFLICT (customer_type, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Loop to seed data for years 2021 to 2025
DO $$
BEGIN
    FOR year_to_seed IN 2021..2025 LOOP
        PERFORM seed_tariffs_for_year(year_to_seed);
    END LOOP;
END;
$$;

-- Drop the function after use
DROP FUNCTION seed_tariffs_for_year(INT);

