-- Drop existing table and type to start fresh
DROP TABLE IF EXISTS tariffs;
DROP TYPE IF EXISTS customer_category;

-- Create the custom type for customer categories
CREATE TYPE customer_category AS ENUM ('Domestic', 'Non-domestic');

-- Create the tariffs table with the correct structure
CREATE TABLE tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type customer_category NOT NULL,
    year INT NOT NULL,
    tiers JSONB NOT NULL,
    maintenance_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.01,
    sanitation_percentage NUMERIC(5, 4) NOT NULL,
    sewerage_rate_per_m3 NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_type, year)
);

-- Seed data for Domestic tariffs for years 2021-2025 using the provided correct rates
INSERT INTO tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3)
VALUES
('Domestic', 2021, '[{"rate": 10.21, "limit": 5}, {"rate": 17.87, "limit": 14}, {"rate": 33.19, "limit": 23}, {"rate": 51.07, "limit": 32}, {"rate": 61.28, "limit": 41}, {"rate": 71.49, "limit": 50}, {"rate": 81.71, "limit": 56}, {"rate": 81.71, "limit": "Infinity"}]', 0.07, 6.25),
('Domestic', 2022, '[{"rate": 10.21, "limit": 5}, {"rate": 17.87, "limit": 14}, {"rate": 21.87, "limit": 30}, {"rate": 24.37, "limit": 50}, {"rate": 26.87, "limit": "Infinity"}]', 0.07, 6.25),
('Domestic', 2023, '[{"rate": 11.00, "limit": 5}, {"rate": 19.00, "limit": 14}, {"rate": 23.00, "limit": 30}, {"rate": 26.00, "limit": 50}, {"rate": 28.00, "limit": "Infinity"}]', 0.07, 7.00),
('Domestic', 2024, '[{"rate": 12.00, "limit": 5}, {"rate": 20.00, "limit": 14}, {"rate": 24.00, "limit": 30}, {"rate": 27.00, "limit": 50}, {"rate": 30.00, "limit": "Infinity"}]', 0.07, 7.50),
('Domestic', 2025, '[{"rate": 13.00, "limit": 5}, {"rate": 21.00, "limit": 14}, {"rate": 25.00, "limit": 30}, {"rate": 28.00, "limit": 50}, {"rate": 32.00, "limit": "Infinity"}]', 0.07, 8.00);

-- Seed data for Non-domestic tariffs for years 2021-2025
INSERT INTO tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3)
VALUES
('Non-domestic', 2021, '[{"rate": 25.62, "limit": 15}, {"rate": 25.62, "limit": "Infinity"}]', 0.10, 8.75),
('Non-domestic', 2022, '[{"rate": 27.00, "limit": 15}, {"rate": 27.00, "limit": "Infinity"}]', 0.10, 9.25),
('Non-domestic', 2023, '[{"rate": 28.50, "limit": 15}, {"rate": 28.50, "limit": "Infinity"}]', 0.10, 9.75),
('Non-domestic', 2024, '[{"rate": 30.00, "limit": 15}, {"rate": 30.00, "limit": "Infinity"}]', 0.10, 10.25),
('Non-domestic', 2025, '[{"rate": 31.50, "limit": 15}, {"rate": 31.50, "limit": "Infinity"}]', 0.10, 10.75);

-- Enable Row Level Security
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Allow public read access" ON tariffs FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON tariffs FOR ALL
    USING (auth.jwt()->>'role' = 'Admin')
    WITH CHECK (auth.jwt()->>'role' = 'Admin');
