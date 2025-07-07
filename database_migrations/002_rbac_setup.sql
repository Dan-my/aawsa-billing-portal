-- This script should be run in the Supabase SQL Editor.
-- It is safe to re-run this script. It will not duplicate data.

-- Enable Row Level Security on the core RBAC tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate on re-run
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to read permissions" ON public.permissions;
DROP POLICY IF EXISTS "Allow authenticated users to read role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow admins to manage roles" ON public.roles;
DROP POLICY IF EXISTS "Allow admins to manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Allow admins to manage role_permissions" ON public.role_permissions;

-- Create Policies for Read Access for any logged-in user
CREATE POLICY "Allow authenticated users to read roles" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read permissions" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read role_permissions" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');

-- This function checks if the currently logged-in user has the 'Admin' role in the staff_members table.
-- SECURITY DEFINER is important here as it allows the function to check tables the user might not have direct access to.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_members sm
    JOIN public.roles r ON sm.role_id = r.id
    WHERE sm.id = auth.uid() AND r.role_name = 'Admin'
  );
$$;

-- Create Policies that grant full management access (SELECT, INSERT, UPDATE, DELETE) ONLY to users who are Admins.
CREATE POLICY "Allow admins to manage roles" ON public.roles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to manage permissions" ON public.permissions FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to manage role_permissions" ON public.role_permissions FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- Seed Roles
-- ON CONFLICT (id) makes this re-runnable. It attempts to insert, and if the ID already exists, it updates it.
INSERT INTO public.roles (id, role_name, description) VALUES
(1, 'Admin', 'Has all permissions and can manage the system.'),
(2, 'Head Office Management', 'Can view all data and reports across all branches.'),
(3, 'Staff Management', 'Manages staff and operations within a specific branch.'),
(4, 'Staff', 'General staff member with limited permissions, usually tied to a branch.')
ON CONFLICT (id) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description;

-- Seed Permissions
-- ON CONFLICT (name) prevents errors if a permission with the same name already exists.
INSERT INTO public.permissions (name, description, category) VALUES
('dashboard_view_all', 'View the main admin dashboard with all branch data', 'Dashboard'),
('dashboard_view_branch', 'View the dashboard for a specific branch', 'Dashboard'),
('branches_view', 'View list of branches', 'Branches'),
('branches_create', 'Create a new branch', 'Branches'),
('branches_update', 'Update an existing branch', 'Branches'),
('branches_delete', 'Delete a branch', 'Branches'),
('staff_view', 'View list of staff members', 'Staff'),
('staff_create', 'Create a new staff member account', 'Staff'),
('staff_update', 'Update a staff member''s profile and permissions', 'Staff'),
('staff_delete', 'Delete a staff member account', 'Staff'),
('permissions_view', 'View roles and their assigned permissions', 'Roles & Permissions'),
('permissions_update', 'Modify the permissions assigned to a role', 'Roles & Permissions'),
('notifications_view', 'View the notification history', 'Notifications'),
('notifications_create', 'Send notifications to all staff or a specific branch', 'Notifications'),
('tariffs_view', 'View the current tariff rates and settings', 'Tariffs'),
('tariffs_update', 'Update tariff rates and billing settings', 'Tariffs'),
('bulk_meters_view_all', 'View all bulk meters across all branches', 'Metering'),
('bulk_meters_view_branch', 'View bulk meters for their assigned branch only', 'Metering'),
('bulk_meters_create', 'Create a new bulk meter record', 'Metering'),
('bulk_meters_update', 'Update an existing bulk meter record', 'Metering'),
('bulk_meters_delete', 'Delete a bulk meter record', 'Metering'),
('customers_view_all', 'View all individual customers across all branches', 'Metering'),
('customers_view_branch', 'View individual customers for their assigned branch only', 'Metering'),
('customers_create', 'Create a new individual customer record', 'Metering'),
('customers_update', 'Update an existing individual customer record', 'Metering'),
('customers_delete', 'Delete an individual customer record', 'Metering'),
('data_entry_access', 'Access the main data entry page (manual and CSV)', 'Data Entry & Readings'),
('meter_readings_view_all', 'View all meter readings from all branches', 'Data Entry & Readings'),
('meter_readings_view_branch', 'View meter readings for their branch only', 'Data Entry & Readings'),
('meter_readings_create', 'Submit new meter readings', 'Data Entry & Readings'),
('reports_generate_all', 'Generate and download reports for all branches', 'Reporting'),
('reports_generate_branch', 'Generate and download reports for their branch only', 'Reporting'),
('reports_view_paid_bills', 'View the list of paid bills screen', 'Reporting'),
('reports_view_sent_bills', 'View the list of all sent bills screen', 'Reporting'),
('settings_view', 'Access the application settings page', 'Settings'),
('settings_update', 'Update application settings', 'Settings')
ON CONFLICT (name) DO NOTHING;

-- Seed Role-Permissions
-- ON CONFLICT ensures that if a role-permission link already exists, it doesn't cause an error.
-- Admin (Role ID 1) - All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 1, p.id FROM public.permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Head Office Management (Role ID 2)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 2, p.id FROM public.permissions p WHERE p.name IN (
    'dashboard_view_all',
    'branches_view', 'branches_create', 'branches_update', 'branches_delete',
    'staff_view', 'staff_create', 'staff_update', 'staff_delete',
    'permissions_view', 'permissions_update',
    'notifications_view', 'notifications_create',
    'tariffs_view', 'tariffs_update',
    'bulk_meters_view_all', 'bulk_meters_create', 'bulk_meters_update', 'bulk_meters_delete',
    'customers_view_all', 'customers_create', 'customers_update', 'customers_delete',
    'data_entry_access',
    'meter_readings_view_all', 'meter_readings_create',
    'reports_generate_all',
    'reports_view_paid_bills',
    'reports_view_sent_bills',
    'settings_view', 'settings_update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Staff Management (Role ID 3)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 3, p.id FROM public.permissions p WHERE p.name IN (
    'dashboard_view_branch',
    'staff_view',
    'notifications_view',
    'bulk_meters_view_branch', 'bulk_meters_create', 'bulk_meters_update', 'bulk_meters_delete',
    'customers_view_branch', 'customers_create', 'customers_update', 'customers_delete',
    'data_entry_access',
    'meter_readings_view_branch', 'meter_readings_create',
    'reports_generate_branch',
    'reports_view_paid_bills',
    'reports_view_sent_bills'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff (Role ID 4)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 4, p.id FROM public.permissions p WHERE p.name IN (
    'dashboard_view_branch',
    'bulk_meters_view_branch',
    'customers_view_branch',
    'data_entry_access',
    'meter_readings_view_branch', 'meter_readings_create',
    'reports_generate_branch'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
