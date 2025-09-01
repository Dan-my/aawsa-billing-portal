-- Add vat_rate and domestic_vat_threshold_m3 to the tariffs table if they don't exist
ALTER TABLE public.tariffs
ADD COLUMN IF NOT EXISTS vat_rate REAL NOT NULL DEFAULT 0.15,
ADD COLUMN IF NOT EXISTS domestic_vat_threshold_m3 INTEGER NOT NULL DEFAULT 15;

-- Ensure RLS is enabled on the tariffs table if not already
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public read-only access to tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Allow admin full access to tariffs" ON public.tariffs;

-- Create policies for read and admin access
CREATE POLICY "Allow public read-only access to tariffs"
ON public.tariffs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin full access to tariffs"
ON public.tariffs FOR ALL
TO authenticated
USING ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin');

-- Optional: Update existing tariffs to set the default values if needed
-- This is useful if the table already existed with NULLs in these new columns
UPDATE public.tariffs SET vat_rate = 0.15 WHERE vat_rate IS NULL;
UPDATE public.tariffs SET domestic_vat_threshold_m3 = 15 WHERE domestic_vat_threshold_m3 IS NULL;

-- Add a comment to describe the table's purpose
COMMENT ON TABLE public.tariffs IS 'Stores tariff rates and billing parameters for different customer types and years.';
