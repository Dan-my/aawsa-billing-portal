
-- Create the tariffs table to store billing rates and fees
CREATE TABLE IF NOT EXISTS public.tariffs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    customer_type text NOT NULL,
    year integer NOT NULL,
    tiers jsonb NOT NULL,
    maintenance_percentage real NOT NULL DEFAULT 0.01,
    sanitation_percentage real NOT NULL,
    sewerage_rate_per_m3 real NOT NULL,
    meter_rent_prices jsonb,
    CONSTRAINT tariffs_pkey PRIMARY KEY (id),
    CONSTRAINT tariffs_customer_type_year_key UNIQUE (customer_type, year)
);

-- Enable Row Level Security
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to everyone
DROP POLICY IF EXISTS "Public read access for tariffs" ON public.tariffs;
CREATE POLICY "Public read access for tariffs"
    ON public.tariffs
    FOR SELECT
    TO public
    USING (true);

-- Allow admins full access
DROP POLICY IF EXISTS "Allow full access to admins" ON public.tariffs;
CREATE POLICY "Allow full access to admins"
    ON public.tariffs
    FOR ALL
    TO public
    USING ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin')
    WITH CHECK ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin');


-- Seed the data for years 2021 through 2025 with the corrected rates
DO $$
DECLARE
    year_to_seed integer;
BEGIN
    FOR year_to_seed IN 2021..2025 LOOP
        -- Seed Domestic Tariff for the current year
        IF NOT EXISTS (SELECT 1 FROM public.tariffs WHERE customer_type = 'Domestic' AND year = year_to_seed) THEN
            INSERT INTO public.tariffs (customer_type, year, tiers, maintenance_percentage, sanitation_percentage, sewerage_rate_per_m3, meter_rent_prices)
            VALUES (
                'Domestic',
                year_to_seed,
                '[
                    {"rate": 10.21, "limit": 5},
                    {"rate": 17.87, "limit": 14},
                    {"rate": 21.87, "limit": 30},
                    {"rate": 24.37, "limit": 50},
                    {"rate": 26.87, "limit": "Infinity"}
                ]'::jsonb,
                0.01, -- 1%
                0.07, -- 7%
                6.25,
                '{"0.5": 15.00, "0.75": 18.00, "1": 25.00, "1.25": 30.00, "1.5": 40.00, "2": 50.00, "2.5": 60.00, "3": 75.00, "4": 100.00, "5": 125.00, "6": 150.00}'::jsonb
            );
        ELSE
            UPDATE public.tariffs
            SET 
                tiers = '[
                    {"rate": 10.21, "limit": 5},
                    {"rate": 17.87, "limit": 14},
                    {"rate": 21.87, "limit": 30},
                    {"rate": 24.37, "limit": 50},
                    {"rate": 26.87, "limit": "Infinity"}
                ]'::jsonb,
                updated_at = now()
            WHERE customer_type = 'Domestic' AND year = year_to_seed;
        END IF;

        -- Seed Non-domestic Tariff for the current year
        IF NOT EXISTS (SELECT 1 FROM public.tariffs WHERE customer_type = 'Non-domestic' AND year = year_to_seed) THEN
            INSERT INTO public.tariffs (customer_type, year, tiers, maintenance_percentage, sanitation_percentage, sewerage_rate_per_m3, meter_rent_prices)
            VALUES (
                'Non-domestic',
                year_to_seed,
                '[
                    {"rate": 20.62, "limit": 15},
                    {"rate": 25.62, "limit": "Infinity"}
                ]'::jsonb,
                0.01, -- 1%
                0.10, -- 10%
                6.88,
                '{"0.5": 15.00, "0.75": 18.00, "1": 25.00, "1.25": 30.00, "1.5": 40.00, "2": 50.00, "2.5": 60.00, "3": 75.00, "4": 100.00, "5": 125.00, "6": 150.00}'::jsonb
            );
        ELSE
            UPDATE public.tariffs
            SET 
                tiers = '[
                    {"rate": 20.62, "limit": 15},
                    {"rate": 25.62, "limit": "Infinity"}
                ]'::jsonb,
                updated_at = now()
            WHERE customer_type = 'Non-domestic' AND year = year_to_seed;
        END IF;
    END LOOP;
END $$;
