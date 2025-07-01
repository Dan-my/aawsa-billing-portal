-- #############################################
-- #            Tariffs Table Setup            #
-- #############################################

-- 1. Create the tariffs table
CREATE TABLE public.tariffs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    customer_type text NOT NULL,
    tier_description text NOT NULL,
    consumption_limit numeric NOT NULL,
    rate_per_m3 numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tariffs_pkey PRIMARY KEY (id)
);

-- 2. Add comments to the columns for clarity in the Supabase UI
COMMENT ON TABLE public.tariffs IS 'Stores the tariff tiers for bill calculations.';
COMMENT ON COLUMN public.tariffs.customer_type IS 'Type of customer (e.g., ''Domestic'', ''Non-domestic'').';
COMMENT ON COLUMN public.tariffs.tier_description IS 'User-friendly description of the tier.';
COMMENT ON COLUMN public.tariffs.consumption_limit IS 'The upper consumption limit for this tier (m³). Use a large number for infinity.';
COMMENT ON COLUMN public.tariffs.rate_per_m3 IS 'The price per cubic meter for this consumption tier.';

-- 3. Enable Row Level Security (RLS) on the tariffs table
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for the tariffs table
-- Policy to allow all authenticated users to read tariffs
CREATE POLICY "Allow authenticated read access to tariffs"
ON public.tariffs
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow full access for Admin users
CREATE POLICY "Allow admins full access to tariffs"
ON public.tariffs
FOR ALL
TO authenticated
USING ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin');

-- 5. Insert default Domestic tariff data
INSERT INTO public.tariffs (customer_type, tier_description, consumption_limit, rate_per_m3) VALUES
('Domestic', 'First 5 m³ consumption', 5, 10.21),
('Domestic', 'From 6 to 14 m³', 14, 17.87),
('Domestic', 'From 15 to 23 m³', 23, 33.19),
('Domestic', 'From 24 to 32 m³', 32, 51.07),
('Domestic', 'From 33 to 41 m³', 41, 61.28),
('Domestic', 'From 42 to 50 m³', 50, 71.49),
('Domestic', 'From 51 to 56 m³', 56, 81.71),
('Domestic', 'Above 56 m³', 999999, 81.71); -- Using 999999 to represent infinity

-- 6. Insert default Non-domestic tariff data
INSERT INTO public.tariffs (customer_type, tier_description, consumption_limit, rate_per_m3) VALUES
('Non-domestic', 'First 5 m³ consumption', 5, 10.21),
('Non-domestic', 'From 6 to 14 m³', 14, 17.87),
('Non-domestic', 'From 15 to 23 m³', 23, 33.19),
('Non-domestic', 'From 24 to 32 m³', 32, 51.07),
('Non-domestic', 'From 33 to 41 m³', 41, 61.28),
('Non-domestic', 'From 42 to 50 m³', 50, 71.49),
('Non-domestic', 'From 51 to 56 m³', 56, 81.71),
('Non-domestic', 'Above 56 m³', 999999, 81.71); -- Using 999999 to represent infinity

-- #############################################
-- #          Meter Rents Table Setup          #
-- #############################################

-- 1. Create the meter_rents table
CREATE TABLE public.meter_rents (
    meter_size numeric NOT NULL,
    rent_price numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT meter_rents_pkey PRIMARY KEY (meter_size)
);

-- 2. Add comments
COMMENT ON TABLE public.meter_rents IS 'Stores the monthly rent price based on meter size.';

-- 3. Enable Row Level Security (RLS) on the meter_rents table
ALTER TABLE public.meter_rents ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for the meter_rents table
-- Policy to allow all authenticated users to read meter rents
CREATE POLICY "Allow authenticated read access to meter rents"
ON public.meter_rents
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow full access for Admin users
CREATE POLICY "Allow admins full access to meter rents"
ON public.meter_rents
FOR ALL
TO authenticated
USING ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin');

-- 5. Insert default meter rent data
INSERT INTO public.meter_rents (meter_size, rent_price) VALUES
(0.5, 15),
(0.75, 20),
(1, 33),
(1.25, 36),
(1.5, 57),
(2, 98),
(2.5, 112),
(3, 148),
(4, 177),
(5, 228),
(6, 259);
