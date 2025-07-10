-- Create the tariffs table
CREATE TABLE IF NOT EXISTS public.tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type TEXT NOT NULL UNIQUE CHECK (customer_type IN ('Domestic', 'Non-domestic')),
    tiers JSONB NOT NULL,
    maintenance_percentage NUMERIC NOT NULL,
    sanitation_percentage NUMERIC NOT NULL,
    sewerage_rate_per_m3 NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read-only access" ON public.tariffs
FOR SELECT
USING (true);

-- Allow admin users to update tariffs
CREATE POLICY "Allow admins to update tariffs" ON public.tariffs
FOR UPDATE
USING (
  (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin'
);

-- Seed initial data if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tariffs WHERE customer_type = 'Domestic') THEN
    INSERT INTO public.tariffs (customer_type, tiers, maintenance_percentage, sanitation_percentage, sewerage_rate_per_m3)
    VALUES (
      'Domestic',
      '[
        {"limit": 5, "rate": 10.21},
        {"limit": 14, "rate": 17.87},
        {"limit": 23, "rate": 33.19},
        {"limit": 32, "rate": 51.07},
        {"limit": 41, "rate": 61.28},
        {"limit": 50, "rate": 71.49},
        {"limit": 56, "rate": 81.71},
        {"limit": "Infinity", "rate": 81.71}
      ]',
      0.01,
      0.07,
      6.25
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tariffs WHERE customer_type = 'Non-domestic') THEN
    INSERT INTO public.tariffs (customer_type, tiers, maintenance_percentage, sanitation_percentage, sewerage_rate_per_m3)
    VALUES (
      'Non-domestic',
      '[
        {"limit": 5, "rate": 10.21},
        {"limit": 14, "rate": 17.87},
        {"limit": 23, "rate": 33.19},
        {"limit": 32, "rate": 51.07},
        {"limit": 41, "rate": 61.28},
        {"limit": 50, "rate": 71.49},
        {"limit": 56, "rate": 81.71},
        {"limit": "Infinity", "rate": 81.71}
      ]',
      0.01,
      0.10,
      8.75
    );
  END IF;
END $$;
