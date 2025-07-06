-- =================================================================
--  DATABASE MIGRATION: ROLE-BASED ACCESS CONTROL (RBAC) SETUP
-- =================================================================
-- This script sets up the necessary tables for a dynamic, database-driven
-- permission system. It creates tables for roles, permissions, and the
-- link between them. It also populates these tables with a default
-- set of roles and sensible permissions for the application.

-- -----------------------------------------------------------------
--  1. CREATE `roles` TABLE
--     - Stores the names and descriptions of user roles.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Stores user roles for the application.';
COMMENT ON COLUMN public.roles.role_name IS 'The unique name of the role (e.g., Admin, Staff).';


-- -----------------------------------------------------------------
--  2. CREATE `permissions` TABLE
--     - A master list of every possible action/privilege in the app.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    permission_key TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.permissions IS 'Defines individual permissions for application features.';
COMMENT ON COLUMN public.permissions.permission_key IS 'A unique key for the permission (e.g., customers.edit).';
COMMENT ON COLUMN public.permissions.category IS 'A category for grouping permissions in the UI (e.g., Customer Management).';


-- -----------------------------------------------------------------
--  3. CREATE `role_permissions` TABLE
--     - Links roles to their assigned permissions (many-to-many).
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Maps permissions to roles.';


-- -----------------------------------------------------------------
--  4. POPULATE `roles` TABLE WITH INITIAL DATA
--     - Adds the default roles for the application.
-- -----------------------------------------------------------------
INSERT INTO public.roles (role_name, description) VALUES
    ('Admin', 'Has unrestricted access to all features and settings.'),
    ('Staff', 'Branch staff with access to daily operations for their assigned branch.'),
    ('Head Office Management', 'Has read-only access to all data across all branches for oversight and reporting.'),
    ('Staff Management', 'Branch manager with permissions to manage staff and branches.')
ON CONFLICT (role_name) DO NOTHING;


-- -----------------------------------------------------------------
--  5. POPULATE `permissions` TABLE WITH INITIAL DATA
--     - Defines all the granular actions available in the app.
-- -----------------------------------------------------------------
INSERT INTO public.permissions (permission_key, category, description) VALUES
    -- Dashboards
    ('dashboard.view.admin', 'Dashboard', 'View the main admin dashboard'),
    ('dashboard.view.staff', 'Dashboard', 'View the staff dashboard for their branch'),
    
    -- Branch Management
    ('branches.view', 'Branch Management', 'View list of all branches'),
    ('branches.create', 'Branch Management', 'Add a new branch'),
    ('branches.edit', 'Branch Management', 'Edit an existing branch'),
    ('branches.delete', 'Branch Management', 'Delete a branch'),
    
    -- Staff Management
    ('staff.view', 'Staff Management', 'View list of all staff members'),
    ('staff.create', 'Staff Management', 'Add a new staff member'),
    ('staff.edit', 'Staff Management', 'Edit a staff member''s profile and role'),
    ('staff.delete', 'Staff Management', 'Delete a staff member'),
    
    -- Notifications
    ('notifications.view', 'Notifications', 'View sent notifications'),
    ('notifications.send', 'Notifications', 'Send new notifications to staff'),
    
    -- Tariff Management
    ('tariffs.view', 'Tariff Management', 'View tariff rates and fees'),
    ('tariffs.edit', 'Tariff Management', 'Edit tariff rates and fees'),
    
    -- Customer Management
    ('customers.view', 'Customer Management', 'View individual customers'),
    ('customers.create', 'Customer Management', 'Add a new individual customer'),
    ('customers.edit', 'Customer Management', 'Edit an individual customer'),
    ('customers.delete', 'Customer Management', 'Delete an individual customer'),
    
    -- Bulk Meter Management
    ('bulk_meters.view', 'Bulk Meter Management', 'View bulk meters'),
    ('bulk_meters.create', 'Bulk Meter Management', 'Add a new bulk meter'),
    ('bulk_meters.edit', 'Bulk Meter Management', 'Edit a bulk meter'),
    ('bulk_meters.delete', 'Bulk Meter Management', 'Delete a bulk meter'),
    ('bulk_meters.view.details', 'Bulk Meter Management', 'View the detailed page for a bulk meter'),
    
    -- Data Entry & Readings
    ('data_entry.view', 'Data Entry', 'Access the main data entry page'),
    ('meter_readings.view', 'Meter Readings', 'View the meter readings list'),
    ('meter_readings.add.manual', 'Meter Readings', 'Add a new meter reading manually'),
    ('meter_readings.add.csv', 'Meter Readings', 'Upload meter readings via CSV'),
    
    -- Reports
    ('reports.view', 'Reporting', 'Access the reports page'),
    ('reports.generate.all_branches', 'Reporting', 'Generate reports for all branches'),
    ('reports.generate.own_branch', 'Reporting', 'Generate reports for own branch'),
    
    -- Settings & Permissions
    ('settings.view', 'System Settings', 'View application settings'),
    ('settings.edit', 'System Settings', 'Edit application settings'),
    ('permissions.view', 'System Settings', 'View roles and permissions'),
    ('permissions.edit', 'System Settings', 'Edit roles and permissions')
ON CONFLICT (permission_key) DO NOTHING;


-- -----------------------------------------------------------------
--  6. POPULATE `role_permissions` TABLE
--     - Assigns the default set of permissions to each role.
-- -----------------------------------------------------------------
DO $$
DECLARE
    admin_role_id INT;
    staff_role_id INT;
    head_office_role_id INT;
    staff_mgmt_role_id INT;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.roles WHERE role_name = 'Admin';
    SELECT id INTO staff_role_id FROM public.roles WHERE role_name = 'Staff';
    SELECT id INTO head_office_role_id FROM public.roles WHERE role_name = 'Head Office Management';
    SELECT id INTO staff_mgmt_role_id FROM public.roles WHERE role_name = 'Staff Management';

    -- Clear existing permissions to ensure a clean slate
    DELETE FROM public.role_permissions;

    -- Assign ALL permissions to Admin
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role_id, p.id FROM public.permissions p
    ON CONFLICT DO NOTHING;

    -- Assign permissions for Staff role
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT staff_role_id, p.id FROM public.permissions p
    WHERE p.permission_key IN (
        'dashboard.view.staff',
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'bulk_meters.view', 'bulk_meters.create', 'bulk_meters.edit', 'bulk_meters.delete', 'bulk_meters.view.details',
        'data_entry.view',
        'meter_readings.view', 'meter_readings.add.manual', 'meter_readings.add.csv',
        'reports.view', 'reports.generate.own_branch',
        'notifications.view'
    ) ON CONFLICT DO NOTHING;
    
    -- Assign permissions for Head Office Management role (Read-only focus)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT head_office_role_id, p.id FROM public.permissions p
    WHERE p.permission_key IN (
        'dashboard.view.admin',
        'branches.view',
        'staff.view',
        'notifications.view',
        'tariffs.view',
        'customers.view',
        'bulk_meters.view', 'bulk_meters.view.details',
        'meter_readings.view',
        'reports.view', 'reports.generate.all_branches'
    ) ON CONFLICT DO NOTHING;
    
    -- Assign permissions for Staff Management role (Manager focus)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT staff_mgmt_role_id, p.id FROM public.permissions p
    WHERE p.permission_key IN (
        -- Everything a staff member can do
        'dashboard.view.staff',
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'bulk_meters.view', 'bulk_meters.create', 'bulk_meters.edit', 'bulk_meters.delete', 'bulk_meters.view.details',
        'data_entry.view',
        'meter_readings.view', 'meter_readings.add.manual', 'meter_readings.add.csv',
        'reports.view', 'reports.generate.own_branch',
        'notifications.view',
        -- Plus management capabilities
        'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
        'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        'notifications.send'
    ) ON CONFLICT DO NOTHING;

END $$;

-- =================================================================
--  END OF MIGRATION SCRIPT
-- =================================================================
