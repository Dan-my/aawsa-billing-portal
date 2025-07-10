-- Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the role_permissions join table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Add role_id to staff_members table if it doesn't exist
-- This is wrapped in a DO block to prevent errors if run multiple times.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff_members' AND column_name='role_id') THEN
        ALTER TABLE public.staff_members ADD COLUMN role_id INTEGER REFERENCES public.roles(id);
    END IF;
END $$;


-- Seed Roles
INSERT INTO public.roles (role_name, description) VALUES
('Admin', 'Full access to all system features.'),
('Head Office Management', 'View-only access to all data across all branches.'),
('Staff Management', 'Manages a specific branch, including its staff and customers.'),
('Staff', 'Data entry and viewing permissions for a specific branch.')
ON CONFLICT (role_name) DO NOTHING;

-- Seed Permissions
INSERT INTO public.permissions (name, category) VALUES
-- Dashboard
('dashboard_view_all', 'Dashboard'),
('dashboard_view_branch', 'Dashboard'),
-- Branches
('branches_view', 'Branch Management'),
('branches_create', 'Branch Management'),
('branches_update', 'Branch Management'),
('branches_delete', 'Branch Management'),
-- Staff
('staff_view', 'Staff Management'),
('staff_create', 'Staff Management'),
('staff_update', 'Staff Management'),
('staff_delete', 'Staff Management'),
-- Roles & Permissions
('permissions_view', 'Permissions'),
('permissions_update', 'Permissions'),
-- Customers
('customers_view_all', 'Customers'),
('customers_view_branch', 'Customers'),
('customers_create', 'Customers'),
('customers_update', 'Customers'),
('customers_delete', 'Customers'),
-- Bulk Meters
('bulk_meters_view_all', 'Bulk Meters'),
('bulk_meters_view_branch', 'Bulk Meters'),
('bulk_meters_create', 'Bulk Meters'),
('bulk_meters_update', 'Bulk Meters'),
('bulk_meters_delete', 'Bulk Meters'),
-- Data Entry
('data_entry_access', 'Data Entry'),
-- Meter Readings
('meter_readings_view_all', 'Meter Readings'),
('meter_readings_view_branch', 'Meter Readings'),
('meter_readings_create', 'Meter Readings'),
-- Reports
('reports_generate_all', 'Reports'),
('reports_generate_branch', 'Reports'),
-- Notifications
('notifications_view', 'Notifications'),
('notifications_create', 'Notifications'),
-- Settings
('settings_view', 'Settings'),
('tariffs_view', 'Tariff Management'),
('tariffs_update', 'Tariff Management')
ON CONFLICT (name) DO NOTHING;

-- Function to seed role_permissions
CREATE OR REPLACE FUNCTION seed_role_permissions()
RETURNS void AS $$
DECLARE
    admin_role_id int;
    ho_mgmt_role_id int;
    staff_mgmt_role_id int;
    staff_role_id int;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.roles WHERE role_name = 'Admin';
    SELECT id INTO ho_mgmt_role_id FROM public.roles WHERE role_name = 'Head Office Management';
    SELECT id INTO staff_mgmt_role_id FROM public.roles WHERE role_name = 'Staff Management';
    SELECT id INTO staff_role_id FROM public.roles WHERE role_name = 'Staff';

    -- Clear existing permissions to ensure a clean slate on re-run
    DELETE FROM public.role_permissions;

    -- Admin Permissions (All)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- Head Office Management Permissions (View All)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT ho_mgmt_role_id, id FROM public.permissions WHERE name IN (
        'dashboard_view_all', 'branches_view', 'staff_view',
        'customers_view_all', 'bulk_meters_view_all', 'meter_readings_view_all',
        'reports_generate_all', 'notifications_view', 'notifications_create', 'tariffs_view'
    ) ON CONFLICT DO NOTHING;

    -- Staff Management Permissions (Branch-level CRUD)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT staff_mgmt_role_id, id FROM public.permissions WHERE name IN (
        'dashboard_view_branch', 'staff_view', 'staff_create', 'staff_update', 'staff_delete',
        'customers_view_branch', 'customers_create', 'customers_update', 'customers_delete',
        'bulk_meters_view_branch', 'bulk_meters_create', 'bulk_meters_update', 'bulk_meters_delete',
        'data_entry_access', 'meter_readings_view_branch', 'meter_readings_create',
        'reports_generate_branch', 'notifications_view', 'notifications_create'
    ) ON CONFLICT DO NOTHING;

    -- Staff Permissions (Branch-level Data Entry & View)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT staff_role_id, id FROM public.permissions WHERE name IN (
        'dashboard_view_branch', 'customers_view_branch', 'bulk_meters_view_branch',
        'data_entry_access', 'meter_readings_view_branch', 'meter_readings_create',
        'reports_generate_branch'
    ) ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- Execute the seed function
SELECT seed_role_permissions();


-- Enable Row Level Security on all relevant tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_customer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for roles, permissions, role_permissions
DROP POLICY IF EXISTS "Allow public read access" ON public.roles;
CREATE POLICY "Allow public read access" ON public.roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access" ON public.permissions;
CREATE POLICY "Allow public read access" ON public.permissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access" ON public.role_permissions;
CREATE POLICY "Allow public read access" ON public.role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON public.role_permissions;
CREATE POLICY "Allow admin full access" ON public.role_permissions
FOR ALL USING (auth.uid() IN (SELECT id FROM public.staff_members WHERE role_id = (SELECT id FROM roles WHERE role_name = 'Admin')));


-- Policies for staff_members
DROP POLICY IF EXISTS "Allow users to view their own data" ON public.staff_members;
CREATE POLICY "Allow users to view their own data" ON public.staff_members
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins and branch managers to view staff" ON public.staff_members;
CREATE POLICY "Allow admins and branch managers to view staff" ON public.staff_members
FOR SELECT USING (
    -- Admin can see all
    (EXISTS (SELECT 1 FROM public.staff_members sm JOIN public.roles r ON sm.role_id = r.id WHERE sm.id = auth.uid() AND r.role_name = 'Admin')) OR
    -- Staff Manager can see staff in their own branch
    (EXISTS (SELECT 1 FROM public.staff_members WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE role_name = 'Staff Management') AND branch = (SELECT branch FROM public.staff_members WHERE id = auth.uid())))
);

DROP POLICY IF EXISTS "Admins can manage all staff" ON public.staff_members;
CREATE POLICY "Admins can manage all staff" ON public.staff_members
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_members sm JOIN public.roles r ON sm.role_id = r.id WHERE sm.id = auth.uid() AND r.role_name = 'Admin')
);
