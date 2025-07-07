-- This script is designed to be idempotent and can be run multiple times safely.
-- It creates roles, permissions, and their associations, and sets up RLS.

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 2. Add role_id to staff_members if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'staff_members'
        AND column_name = 'role_id'
    ) THEN
        ALTER TABLE public.staff_members ADD COLUMN role_id INT REFERENCES public.roles(id);
    END IF;
END $$;


-- 3. Seed roles
INSERT INTO public.roles (role_name, description) VALUES
('Admin', 'Has all permissions and can manage the entire system.'),
('Head Office Management', 'Can view all data and manage high-level settings.'),
('Staff Management', 'Can manage staff and data within a specific branch.'),
('Staff', 'Can perform daily data entry and operational tasks within their branch.')
ON CONFLICT (role_name) DO NOTHING;

-- 4. Seed permissions
INSERT INTO public.permissions (name, description, category) VALUES
-- Dashboard
('dashboard_view_all', 'Can view the main admin dashboard with all data.', 'Dashboard'),
('dashboard_view_branch', 'Can view the branch-specific dashboard (Staff & Staff Management).', 'Dashboard'),
-- Branches
('branches_create', 'Can create new branches.', 'Branch Management'),
('branches_view', 'Can view all branches.', 'Branch Management'),
('branches_update', 'Can edit existing branches.', 'Branch Management'),
('branches_delete', 'Can delete branches.', 'Branch Management'),
-- Staff
('staff_create', 'Can create new staff member accounts.', 'Staff Management'),
('staff_view', 'Can view all staff members.', 'Staff Management'),
('staff_update', 'Can edit staff member details.', 'Staff Management'),
('staff_delete', 'Can delete staff members.', 'Staff Management'),
-- Permissions
('permissions_view', 'Can view roles and their assigned permissions.', 'Permissions'),
('permissions_update', 'Can edit the permissions assigned to a role.', 'Permissions'),
-- Notifications
('notifications_create', 'Can send notifications to staff.', 'Notifications'),
('notifications_view', 'Can view the history of sent notifications.', 'Notifications'),
-- Tariffs
('tariffs_view', 'Can view tariff rate settings.', 'Tariffs'),
('tariffs_update', 'Can update tariff rate settings.', 'Tariffs'),
-- Bulk Meters
('bulk_meters_create', 'Can create new bulk meters.', 'Metering'),
('bulk_meters_view_all', 'Can view all bulk meters across all branches.', 'Metering'),
('bulk_meters_view_branch', 'Can view bulk meters assigned to their branch.', 'Metering'),
('bulk_meters_update', 'Can edit bulk meter details.', 'Metering'),
('bulk_meters_delete', 'Can delete bulk meters.', 'Metering'),
-- Individual Customers
('customers_create', 'Can create new individual customers.', 'Metering'),
('customers_view_all', 'Can view all customers across all branches.', 'Metering'),
('customers_view_branch', 'Can view customers within their branch.', 'Metering'),
('customers_update', 'Can edit individual customer details.', 'Metering'),
('customers_delete', 'Can delete individual customers.', 'Metering'),
-- Data Entry & Readings
('data_entry_access', 'Can access the main data entry page (manual and CSV).', 'Data & Reports'),
('meter_readings_create', 'Can add new meter readings.', 'Data & Reports'),
('meter_readings_view_all', 'Can view all meter readings.', 'Data & Reports'),
('meter_readings_view_branch', 'Can view meter readings for their branch.', 'Data & Reports'),
-- Reports
('reports_generate_all', 'Can generate and download reports for all branches.', 'Data & Reports'),
('reports_generate_branch', 'Can generate and download reports for their branch.', 'Data & Reports'),
('reports_view_paid_bills', 'Can view the on-screen "List of Paid Bills" report.', 'Data & Reports'),
('reports_view_sent_bills', 'Can view the on-screen "List of Sent Bills" report.', 'Data & Reports'),
-- Settings
('settings_view', 'Can view and modify application settings.', 'Settings')
ON CONFLICT (name) DO NOTHING;


-- 5. Helper function to assign permissions
CREATE OR REPLACE FUNCTION assign_permission(p_role_name TEXT, p_permission_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_role_id INT;
    v_permission_id INT;
BEGIN
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = p_role_name;
    SELECT id INTO v_permission_id FROM public.permissions WHERE name = p_permission_name;

    IF v_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Assign all permissions to Admin
DO $$
DECLARE
    v_admin_role_id INT;
    rec RECORD;
BEGIN
    SELECT id INTO v_admin_role_id FROM public.roles WHERE role_name = 'Admin';
    IF v_admin_role_id IS NOT NULL THEN
        FOR rec IN SELECT id FROM public.permissions LOOP
            INSERT INTO public.role_permissions (role_id, permission_id)
            VALUES (v_admin_role_id, rec.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;


-- 7. Assign permissions for Head Office Management
-- Can do almost everything except create other admins or change fundamental permissions.
SELECT assign_permission('Head Office Management', 'dashboard_view_all');
SELECT assign_permission('Head Office Management', 'branches_create');
SELECT assign_permission('Head Office Management', 'branches_view');
SELECT assign_permission('Head Office Management', 'branches_update');
SELECT assign_permission('Head Office Management', 'branches_delete');
SELECT assign_permission('Head Office Management', 'staff_create');
SELECT assign_permission('Head Office Management', 'staff_view');
SELECT assign_permission('Head Office Management', 'staff_update');
SELECT assign_permission('Head Office Management', 'staff_delete');
SELECT assign_permission('Head Office Management', 'permissions_view');
-- Does NOT get permissions_update
SELECT assign_permission('Head Office Management', 'notifications_create');
SELECT assign_permission('Head Office Management', 'notifications_view');
SELECT assign_permission('Head Office Management', 'tariffs_view');
SELECT assign_permission('Head Office Management', 'tariffs_update');
SELECT assign_permission('Head Office Management', 'bulk_meters_create');
SELECT assign_permission('Head Office Management', 'bulk_meters_view_all');
SELECT assign_permission('Head Office Management', 'bulk_meters_update');
SELECT assign_permission('Head Office Management', 'bulk_meters_delete');
SELECT assign_permission('Head Office Management', 'customers_create');
SELECT assign_permission('Head Office Management', 'customers_view_all');
SELECT assign_permission('Head Office Management', 'customers_update');
SELECT assign_permission('Head Office Management', 'customers_delete');
SELECT assign_permission('Head Office Management', 'data_entry_access');
SELECT assign_permission('Head Office Management', 'meter_readings_create');
SELECT assign_permission('Head Office Management', 'meter_readings_view_all');
SELECT assign_permission('Head Office Management', 'reports_generate_all');
SELECT assign_permission('Head Office Management', 'reports_view_paid_bills');
SELECT assign_permission('Head Office Management', 'reports_view_sent_bills');
SELECT assign_permission('Head Office Management', 'settings_view');

-- 8. Assign permissions for Staff Management
-- Focused on managing their own branch
SELECT assign_permission('Staff Management', 'dashboard_view_branch');
SELECT assign_permission('Staff Management', 'staff_create');
SELECT assign_permission('Staff Management', 'staff_view');
SELECT assign_permission('Staff Management', 'staff_update');
SELECT assign_permission('Staff Management', 'staff_delete');
SELECT assign_permission('Staff Management', 'notifications_view'); -- Can see notifications
SELECT assign_permission('Staff Management', 'bulk_meters_create');
SELECT assign_permission('Staff Management', 'bulk_meters_view_branch');
SELECT assign_permission('Staff Management', 'bulk_meters_update');
SELECT assign_permission('Staff Management', 'bulk_meters_delete');
SELECT assign_permission('Staff Management', 'customers_create');
SELECT assign_permission('Staff Management', 'customers_view_branch');
SELECT assign_permission('Staff Management', 'customers_update');
SELECT assign_permission('Staff Management', 'customers_delete');
SELECT assign_permission('Staff Management', 'data_entry_access');
SELECT assign_permission('Staff Management', 'meter_readings_create');
SELECT assign_permission('Staff Management', 'meter_readings_view_branch');
SELECT assign_permission('Staff Management', 'reports_generate_branch');
SELECT assign_permission('Staff Management', 'reports_view_paid_bills');
SELECT assign_permission('Staff Management', 'reports_view_sent_bills');

-- 9. Assign permissions for Staff
-- Basic data entry and viewing for their branch
SELECT assign_permission('Staff', 'dashboard_view_branch');
SELECT assign_permission('Staff', 'notifications_view');
SELECT assign_permission('Staff', 'bulk_meters_view_branch');
SELECT assign_permission('Staff', 'customers_view_branch');
SELECT assign_permission('Staff', 'data_entry_access');
SELECT assign_permission('Staff', 'meter_readings_create');
SELECT assign_permission('Staff', 'meter_readings_view_branch');
SELECT assign_permission('Staff', 'reports_generate_branch');

-- 10. Enable Row Level Security (RLS) on permission tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies
-- Allow authenticated users to read roles, permissions, and their links.
CREATE POLICY "Allow authenticated read access to roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to role_permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- Deny all modifications for non-admins (or a specific super-role if you had one)
-- This is a safeguard. The primary protection is your API logic.
CREATE POLICY "Deny modification of roles for non-admins"
ON public.roles FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny modification of permissions for non-admins"
ON public.permissions FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny modification of role_permissions for non-admins"
ON public.role_permissions FOR ALL
USING (false)
WITH CHECK (false);
