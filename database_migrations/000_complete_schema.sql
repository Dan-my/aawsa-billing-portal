-- AAWSA Billing Portal - Complete PostgreSQL Schema
-- This script contains all necessary commands to set up the database from scratch.
-- It is designed to be run on a fresh PostgreSQL database.

-- Create a custom type for roles for easier use in columns.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Admin', 'Staff Management', 'Head Office Management', 'Staff');
    END IF;
END$$;

-- Create a custom type for status for branches
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_status') THEN
        CREATE TYPE branch_status AS ENUM ('Active', 'Inactive');
    END IF;
END$$;

-- Create a custom type for status for staff members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_status') THEN
        CREATE TYPE staff_status AS ENUM ('Active', 'Inactive', 'On Leave');
    END IF;
END$$;

-- Create a custom type for customer type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_category') THEN
        CREATE TYPE customer_category AS ENUM ('Domestic', 'Non-domestic');
    END IF;
END$$;

-- Create a custom type for sewerage connection
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sewerage_option') THEN
        CREATE TYPE sewerage_option AS ENUM ('Yes', 'No');
    END IF;
END$$;

-- Create a custom type for individual customer status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'individual_customer_status') THEN
        CREATE TYPE individual_customer_status AS ENUM ('Active', 'Inactive', 'Suspended', 'Pending Approval', 'Rejected');
    END IF;
END$$;

-- Create a custom type for payment status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_payment_status') THEN
        CREATE TYPE bill_payment_status AS ENUM ('Paid', 'Unpaid', 'Pending');
    END IF;
END$$;

-- Create a custom type for bulk meter status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bulk_meter_status') THEN
        CREATE TYPE bulk_meter_status AS ENUM ('Active', 'Maintenance', 'Decommissioned', 'Pending Approval', 'Rejected');
    END IF;
END$$;

-- =============================================
-- SECTION 1: TABLES
-- =============================================

-- Table: branches
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactPhone" BIGINT,
    status branch_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.branches IS 'Stores information about different AAWSA branches.';

-- Table: roles
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.roles IS 'Defines user roles within the application.';

-- Table: permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.permissions IS 'Lists all possible permissions in the system.';

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);
COMMENT ON TABLE public.role_permissions IS 'Maps permissions to roles.';

-- Table: staff_members
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL REFERENCES public.roles(role_name),
    role_id INTEGER REFERENCES public.roles(id),
    branch TEXT NOT NULL,
    branch_id TEXT REFERENCES public.branches(id),
    status staff_status NOT NULL,
    phone TEXT,
    hire_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.staff_members IS 'Stores information about staff members and their roles/branches.';


-- Table: bulk_meters
CREATE TABLE IF NOT EXISTS public.bulk_meters (
    "customerKeyNumber" TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "meterSize" REAL NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "previousReading" REAL NOT NULL,
    "currentReading" REAL NOT NULL,
    month TEXT NOT NULL,
    "specificArea" TEXT NOT NULL,
    "subCity" TEXT NOT NULL,
    "woreda" TEXT NOT NULL,
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    status bulk_meter_status NOT NULL DEFAULT 'Active',
    "paymentStatus" bill_payment_status NOT NULL DEFAULT 'Unpaid',
    charge_group customer_category NOT NULL DEFAULT 'Non-domestic',
    sewerage_connection sewerage_option NOT NULL DEFAULT 'No',
    bulk_usage REAL,
    total_bulk_bill REAL,
    difference_usage REAL,
    difference_bill REAL,
    "outStandingbill" REAL DEFAULT 0,
    x_coordinate REAL,
    y_coordinate REAL,
    approved_by UUID REFERENCES public.staff_members(id),
    approved_at TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ
);
COMMENT ON TABLE public.bulk_meters IS 'Stores data for large, high-capacity bulk meters.';


-- Table: individual_customers
CREATE TABLE IF NOT EXISTS public.individual_customers (
    "customerKeyNumber" TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "customerType" customer_category NOT NULL,
    "bookNumber" TEXT NOT NULL,
    ordinal INTEGER NOT NULL,
    "meterSize" REAL NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "previousReading" REAL NOT NULL,
    "currentReading" REAL NOT NULL,
    month TEXT NOT NULL,
    "specificArea" TEXT NOT NULL,
    "subCity" TEXT NOT NULL,
    "woreda" TEXT NOT NULL,
    "sewerageConnection" sewerage_option NOT NULL,
    "assignedBulkMeterId" TEXT REFERENCES public.bulk_meters("customerKeyNumber") ON DELETE SET NULL,
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    status individual_customer_status NOT NULL DEFAULT 'Active',
    "paymentStatus" bill_payment_status NOT NULL DEFAULT 'Unpaid',
    "calculatedBill" REAL NOT NULL DEFAULT 0,
    arrears REAL NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES public.staff_members(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.individual_customers IS 'Stores data for individual end-user customers.';


-- Table: bills
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    individual_customer_id TEXT REFERENCES public.individual_customers("customerKeyNumber") ON DELETE CASCADE,
    bulk_meter_id TEXT REFERENCES public.bulk_meters("customerKeyNumber") ON DELETE CASCADE,
    bill_period_start_date DATE NOT NULL,
    bill_period_end_date DATE NOT NULL,
    month_year TEXT NOT NULL,
    previous_reading_value REAL NOT NULL,
    current_reading_value REAL NOT NULL,
    usage_m3 REAL,
    difference_usage REAL,
    base_water_charge REAL NOT NULL,
    sewerage_charge REAL,
    maintenance_fee REAL,
    sanitation_fee REAL,
    meter_rent REAL,
    balance_carried_forward REAL,
    total_amount_due REAL NOT NULL,
    amount_paid REAL,
    balance_due REAL,
    due_date DATE NOT NULL,
    payment_status bill_payment_status NOT NULL DEFAULT 'Unpaid',
    bill_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.bills IS 'Stores generated billing information for both customer types.';


-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    target_branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.notifications IS 'Stores notifications sent to staff or branches.';


-- Table: tariffs
CREATE TABLE IF NOT EXISTS public.tariffs (
    customer_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    tiers JSONB NOT NULL,
    tiers_progressive JSONB, -- Added for progressive calculation
    maintenance_percentage REAL NOT NULL DEFAULT 0.01,
    sanitation_percentage REAL NOT NULL,
    sewerage_rate_per_m3 REAL NOT NULL,
    meter_rent_prices JSONB,
    vat_rate REAL NOT NULL DEFAULT 0.15,
    domestic_vat_threshold_m3 REAL NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_type, year)
);
COMMENT ON TABLE public.tariffs IS 'Stores billing tariff rates and fee structures by year and customer type.';


-- =============================================
-- SECTION 2: FUNCTIONS
-- =============================================

-- Function: insert_notification
-- This function is a workaround to bypass RLS for inserting notifications,
-- which is a common pattern in Supabase.
CREATE OR REPLACE FUNCTION public.insert_notification(
    p_title TEXT,
    p_message TEXT,
    p_sender_name TEXT,
    p_target_branch_id TEXT
)
RETURNS SETOF public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING *;
END;
$$;
COMMENT ON FUNCTION public.insert_notification IS 'Safely inserts a notification, bypassing RLS. To be called by authenticated users.';

-- Function: update_role_permissions
-- Manages the many-to-many relationship between roles and permissions.
CREATE OR REPLACE FUNCTION public.update_role_permissions(
    p_role_id INTEGER,
    p_permission_ids INTEGER[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remove existing permissions for the role
    DELETE FROM public.role_permissions WHERE role_id = p_role_id;

    -- Add new permissions for the role
    IF array_length(p_permission_ids, 1) > 0 THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT p_role_id, unnest(p_permission_ids);
    END IF;
END;
$$;
COMMENT ON FUNCTION public.update_role_permissions IS 'Updates the set of permissions associated with a specific role.';


-- =============================================
-- SECTION 3: DEFAULT DATA (ROLES & PERMISSIONS)
-- =============================================

-- Insert Roles
INSERT INTO public.roles (id, role_name, description) VALUES
(1, 'Admin', 'Has unrestricted access to all system features and data.'),
(2, 'Staff Management', 'Manages staff, customers, and operations for a specific branch.'),
(3, 'Staff', 'Data entry and viewing role for a specific branch.'),
(4, 'Head Office Management', 'High-level, view-only access across all branches.')
ON CONFLICT (id) DO UPDATE SET role_name = EXCLUDED.role_name, description = EXCLUDED.description;


-- Insert Permissions
INSERT INTO public.permissions (id, name, description, category) VALUES
(1, 'dashboard_view_all', 'View the main admin dashboard with aggregated data from all branches.', 'Dashboard'),
(2, 'dashboard_view_branch', 'View the dashboard for their assigned branch, including branch comparison charts.', 'Dashboard'),
(3, 'branches_view', 'View the list of all branches.', 'Branch Management'),
(4, 'branches_create', 'Create new branches.', 'Branch Management'),
(5, 'branches_update', 'Update details of any branch.', 'Branch Management'),
(6, 'branches_delete', 'Delete any branch.', 'Branch Management'),
(7, 'staff_view', 'View all staff members across all branches.', 'Staff Management'),
(8, 'staff_create', 'Create new staff members and assign them to roles and branches.', 'Staff Management'),
(9, 'staff_update', 'Update any staff member''s profile, role, or branch.', 'Staff Management'),
(10, 'staff_delete', 'Delete any staff member.', 'Staff Management'),
(11, 'customers_view_all', 'View all individual customers across all branches.', 'Customer Management'),
(12, 'customers_view_branch', 'View individual customers only within their assigned branch.', 'Customer Management'),
(13, 'customers_create', 'Create new individual customer records.', 'Customer Management'),
(14, 'customers_update', 'Update records of any individual customer.', 'Customer Management'),
(15, 'customers_delete', 'Delete any individual customer.', 'Customer Management'),
(16, 'bulk_meters_view_all', 'View all bulk meters across all branches.', 'Bulk Meter Management'),
(17, 'bulk_meters_view_branch', 'View bulk meters only within their assigned branch.', 'Bulk Meter Management'),
(18, 'bulk_meters_create', 'Create new bulk meter records.', 'Bulk Meter Management'),
(19, 'bulk_meters_update', 'Update records of any bulk meter.', 'Bulk Meter Management'),
(20, 'bulk_meters_delete', 'Delete any bulk meter.', 'Bulk Meter Management'),
(21, 'data_entry_access', 'Access the Data Entry pages (Manual and CSV).', 'Data Entry & Reports'),
(22, 'reports_generate_all', 'Generate and view reports with data from all branches.', 'Data Entry & Reports'),
(23, 'reports_generate_branch', 'Generate and view reports filtered to their own branch data.', 'Data Entry & Reports'),
(24, 'notifications_view', 'View the notifications page.', 'Notifications'),
(25, 'notifications_create', 'Send notifications to all staff or specific branches.', 'Notifications'),
(26, 'permissions_view', 'View the Roles & Permissions management page.', 'System Administration'),
(27, 'permissions_update', 'Modify the permissions assigned to any role.', 'System Administration'),
(28, 'settings_view', 'View the application settings page.', 'System Administration'),
(29, 'settings_update', 'Modify global application settings.', 'System Administration'),
(30, 'customers_approve', 'Approve or reject new customer records.', 'Customer Management'),
(31, 'bulk_meters_approve', 'Approve or reject new bulk meter records.', 'Bulk Meter Management'),
(32, 'meter_readings_view_all', 'View meter readings from all branches.', 'Data Entry & Reports'),
(33, 'meter_readings_view_branch', 'View meter readings for their own branch.', 'Data Entry & Reports'),
(34, 'meter_readings_create', 'Create new meter readings.', 'Data Entry & Reports'),
(35, 'tariffs_view', 'View the tariff management page.', 'System Administration'),
(36, 'tariffs_update', 'Update tariff rates and billing rules.', 'System Administration')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category;

-- Reset sequence for permissions if necessary
SELECT setval('public.permissions_id_seq', (SELECT MAX(id) FROM public.permissions));
SELECT setval('public.roles_id_seq', (SELECT MAX(id) FROM public.roles));


-- Assign Permissions to Roles
-- Clear existing assignments first to ensure a clean slate
TRUNCATE public.role_permissions;

-- Admin (all permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 1, id FROM public.permissions;

-- Staff Management
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
(2, 2), (2, 12), (2, 13), (2, 14), (2, 15), (2, 17), (2, 18), (2, 19), (2, 20), (2, 21), (2, 23), (2, 24), (2, 25), (2, 30), (2, 31), (2, 33), (2, 34);

-- Staff
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
(3, 2), (3, 12), (3, 13), (3, 17), (3, 18), (3, 21), (3, 23), (3, 33), (3, 34);

-- Head Office Management
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
(4, 1), (4, 3), (4, 7), (4, 11), (4, 16), (4, 22), (4, 24), (4, 25), (4, 32), (4, 35);


-- =============================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS for all relevant tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_meters ENABLE ROW LEVEL SECURITY;
-- Add other tables as needed...

-- Policies for 'roles', 'permissions', 'role_permissions'
-- Allow public read access as this data is needed by the client to build the UI.
DROP POLICY IF EXISTS "Allow public read access" ON public.roles;
CREATE POLICY "Allow public read access" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.permissions;
CREATE POLICY "Allow public read access" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.role_permissions;
CREATE POLICY "Allow public read access" ON public.role_permissions FOR SELECT USING (true);

-- Allow admins to manage these tables
DROP POLICY IF EXISTS "Allow admin full access" ON public.roles;
CREATE POLICY "Allow admin full access" ON public.roles FOR ALL
USING ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' )
WITH CHECK ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' );

DROP POLICY IF EXISTS "Allow admin full access" ON public.permissions;
CREATE POLICY "Allow admin full access" ON public.permissions FOR ALL
USING ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' )
WITH CHECK ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' );

DROP POLICY IF EXISTS "Allow admin full access" ON public.role_permissions;
CREATE POLICY "Allow admin full access" ON public.role_permissions FOR ALL
USING ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' )
WITH CHECK ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' );


-- General policy for admins to have full access
-- This is a simple model. A more complex one would check for specific permissions.
DROP POLICY IF EXISTS "Admin full access" ON public.branches;
CREATE POLICY "Admin full access" ON public.branches FOR ALL
USING ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' )
WITH CHECK ( (SELECT role FROM public.staff_members WHERE id = auth.uid()) = 'Admin' );

-- Example policy for Staff Management (can only see/edit their own branch)
DROP POLICY IF EXISTS "Staff Management can view their branch" ON public.branches;
CREATE POLICY "Staff Management can view their branch" ON public.branches FOR SELECT
USING ( id = (SELECT branch_id FROM public.staff_members WHERE id = auth.uid()) );


-- Example policy for individual_customers
DROP POLICY IF EXISTS "Users can only see customers in their own branch" ON public.individual_customers;
CREATE POLICY "Users can only see customers in their own branch" ON public.individual_customers FOR SELECT
USING ( branch_id = (SELECT branch_id FROM public.staff_members WHERE id = auth.uid()) );

-- Make sure to add RLS policies for all other tables as required by your application's logic.

-- Grant usage on schema and select on tables to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant insert/update/delete to authenticated role for specific tables if needed
-- This is often handled by SECURITY DEFINER functions in a more secure setup.
GRANT INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
-- Add other grants as needed.

-- =============================================
-- SECTION 5: INITIAL TARIFF DATA
-- =============================================
-- Insert tariff data for Domestic customers for the year 2021
INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3, meter_rent_prices, tiers_progressive)
VALUES
('Domestic', 2021,
  '[{"rate": 5.7, "limit": 7}, {"rate": 8.7, "limit": 20}, {"rate": 13, "limit": 40}, {"rate": 16.2, "limit": 100}, {"rate": 16.8, "limit": "Infinity"}]',
  0.07, 1.8,
  '{"0.5": 15.00, "0.75": 15.00, "1": 15.00, "1.25": 15.00, "1.5": 15.00, "2": 25.00, "2.5": 25.00, "3": 25.00, "4": 25.00, "5": 25.00, "6": 25.00}',
  '[{"rate": 10.21, "limit": 5}, {"rate": 17.87, "limit": 14}, {"rate": 33.19, "limit": 23}, {"rate": 51.07, "limit": 32}, {"rate": 61.28, "limit": 41}, {"rate": 71.49, "limit": 50}, {"rate": 71.49, "limit": "Infinity"}]'
)
ON CONFLICT (customer_type, year) DO UPDATE SET
  tiers = EXCLUDED.tiers,
  sanitation_percentage = EXCLUDED.sanitation_percentage,
  sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3,
  meter_rent_prices = EXCLUDED.meter_rent_prices,
  tiers_progressive = EXCLUDED.tiers_progressive;

-- Insert tariff data for Non-domestic customers for the year 2021
INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3, meter_rent_prices)
VALUES
('Non-domestic', 2021,
  '[{"rate": 16.8, "limit": "Infinity"}]',
  0.10, 2.5,
  '{"0.5": 15.00, "0.75": 15.00, "1": 15.00, "1.25": 15.00, "1.5": 15.00, "2": 25.00, "2.5": 25.00, "3": 25.00, "4": 25.00, "5": 25.00, "6": 25.00}'
)
ON CONFLICT (customer_type, year) DO UPDATE SET
  tiers = EXCLUDED.tiers,
  sanitation_percentage = EXCLUDED.sanitation_percentage,
  sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3,
  meter_rent_prices = EXCLUDED.meter_rent_prices;

-- Insert tariff data for Domestic customers for the year 2025
INSERT INTO public.tariffs (customer_type, year, tiers, sanitation_percentage, sewerage_rate_per_m3, meter_rent_prices, tiers_progressive)
VALUES
('Domestic', 2025,
  '[{"rate": 7.5, "limit": 7}, {"rate": 10, "limit": 20}, {"rate": 15, "limit": 40}, {"rate": 18, "limit": 100}, {"rate": 20, "limit": "Infinity"}]',
  0.07, 1.8,
  '{"0.5": 15.00, "0.75": 15.00, "1": 15.00, "1.25": 15.00, "1.5": 15.00, "2": 25.00, "2.5": 25.00, "3": 25.00, "4": 25.00, "5": 25.00, "6": 25.00}',
  '[{"rate": 10.21, "limit": 5}, {"rate": 17.87, "limit": 14}, {"rate": 33.19, "limit": 23}, {"rate": 51.07, "limit": 32}, {"rate": 61.28, "limit": 41}, {"rate": 71.49, "limit": 50}, {"rate": 71.49, "limit": "Infinity"}]'
)
ON CONFLICT (customer_type, year) DO UPDATE SET
  tiers = EXCLUDED.tiers,
  sanitation_percentage = EXCLUDED.sanitation_percentage,
  sewerage_rate_per_m3 = EXCLUDED.sewerage_rate_per_m3,
  meter_rent_prices = EXCLUDED.meter_rent_prices,
  tiers_progressive = EXCLUDED.tiers_progressive;


-- You can add more INSERT statements here for other years or customer types as needed.

-- =============================================
-- END OF SCRIPT
-- =============================================
