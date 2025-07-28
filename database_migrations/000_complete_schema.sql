-- Enable the UUID extension if it's not already enabled.
-- This is required to use uuid_generate_v4().
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 15.1 (Debian 15.1-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Custom type for branch status
CREATE TYPE public.branch_status AS ENUM (
    'Active',
    'Inactive'
);

-- Custom type for customer types
CREATE TYPE public.customer_type AS ENUM (
    'Domestic',
    'Non-domestic'
);

-- Custom type for meter reading status
CREATE TYPE public.meter_reading_status AS ENUM (
    'Read',
    'Estimated',
    'Missed'
);

-- Custom type for payment status
CREATE TYPE public.payment_status AS ENUM (
    'Paid',
    'Unpaid',
    'Pending'
);

-- Custom type for payment methods
CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Bank Transfer',
    'Mobile Money',
    'Online Payment',
    'Other'
);

-- Custom type for report status
CREATE TYPE public.report_status AS ENUM (
    'Generated',
    'Pending',
    'Failed',
    'Archived'
);

-- Custom type for sewerage connection
CREATE TYPE public.sewerage_connection AS ENUM (
    'Yes',
    'No'
);

-- Custom type for staff status
CREATE TYPE public.staff_status AS ENUM (
    'Active',
    'Inactive',
    'On Leave'
);

-- Custom type for individual customer status
CREATE TYPE public.individual_customer_status AS ENUM (
    'Active',
    'Inactive',
    'Suspended',
    'Pending Approval',
    'Rejected'
);

-- Custom type for bulk meter status
CREATE TYPE public.bulk_meter_status AS ENUM (
    'Active',
    'Maintenance',
    'Decommissioned',
    'Pending Approval',
    'Rejected'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

-- Table: branches
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactPhone" BIGINT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    category TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.permissions IS 'Lists all possible actions that can be controlled.';

-- Table: role_permissions (join table)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);
COMMENT ON TABLE public.role_permissions IS 'Maps roles to their assigned permissions.';

-- Table: staff_members
CREATE TABLE IF NOT EXISTS public.staff_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    role TEXT NOT NULL,
    branch TEXT NOT NULL,
    status public.staff_status NOT NULL,
    phone TEXT,
    hire_date DATE,
    role_id INTEGER REFERENCES public.roles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.staff_members IS 'Stores information about staff members and their roles.';

-- Table: tariffs
CREATE TABLE IF NOT EXISTS public.tariffs (
    customer_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    tiers JSONB NOT NULL,
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
COMMENT ON TABLE public.tariffs IS 'Stores billing tariff structures for different customer types and years.';

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
    woreda TEXT NOT NULL,
    branch_id TEXT REFERENCES public.branches(id),
    status public.bulk_meter_status NOT NULL,
    "paymentStatus" public.payment_status NOT NULL,
    charge_group public.customer_type NOT NULL,
    sewerage_connection public.sewerage_connection NOT NULL,
    bulk_usage REAL,
    total_bulk_bill REAL,
    difference_usage REAL,
    difference_bill REAL,
    "outStandingbill" REAL,
    x_coordinate REAL,
    y_coordinate REAL,
    approved_by TEXT REFERENCES public.staff_members(id),
    approved_at TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Table: individual_customers
CREATE TABLE IF NOT EXISTS public.individual_customers (
    "customerKeyNumber" TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "customerType" public.customer_type NOT NULL,
    "bookNumber" TEXT NOT NULL,
    ordinal INTEGER NOT NULL,
    "meterSize" REAL NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "previousReading" REAL NOT NULL,
    "currentReading" REAL NOT NULL,
    month TEXT NOT NULL,
    "specificArea" TEXT NOT NULL,
    "subCity" TEXT NOT NULL,
    woreda TEXT NOT NULL,
    "sewerageConnection" public.sewerage_connection NOT NULL,
    "assignedBulkMeterId" TEXT REFERENCES public.bulk_meters("customerKeyNumber"),
    branch_id TEXT REFERENCES public.branches(id),
    status public.individual_customer_status NOT NULL,
    "paymentStatus" public.payment_status NOT NULL,
    "calculatedBill" REAL NOT NULL,
    arrears REAL NOT NULL DEFAULT 0,
    approved_by TEXT REFERENCES public.staff_members(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table: bills
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    individual_customer_id TEXT REFERENCES public.individual_customers("customerKeyNumber"),
    bulk_meter_id TEXT REFERENCES public.bulk_meters("customerKeyNumber"),
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
    payment_status public.payment_status NOT NULL,
    bill_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_customer_or_meter CHECK (individual_customer_id IS NOT NULL OR bulk_meter_id IS NOT NULL)
);

-- Table: individual_customer_readings
CREATE TABLE IF NOT EXISTS public.individual_customer_readings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    individual_customer_id TEXT NOT NULL REFERENCES public.individual_customers("customerKeyNumber"),
    reader_staff_id TEXT REFERENCES public.staff_members(id),
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_year TEXT NOT NULL,
    reading_value REAL NOT NULL,
    is_estimate BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bulk_meter_readings
CREATE TABLE IF NOT EXISTS public.bulk_meter_readings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_meter_id TEXT NOT NULL REFERENCES public.bulk_meters("customerKeyNumber"),
    reader_staff_id TEXT REFERENCES public.staff_members(id),
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_year TEXT NOT NULL,
    reading_value REAL NOT NULL,
    is_estimate BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id TEXT REFERENCES public.bills(id),
    individual_customer_id TEXT REFERENCES public.individual_customers("customerKeyNumber"),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_paid REAL NOT NULL,
    payment_method public.payment_method NOT NULL,
    transaction_reference TEXT,
    processed_by_staff_id TEXT REFERENCES public.staff_members(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reports
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name public.report_name NOT NULL,
    description TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by_staff_id TEXT REFERENCES public.staff_members(id),
    parameters JSONB,
    file_format TEXT,
    file_name TEXT,
    status public.report_status,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    target_branch_id TEXT REFERENCES public.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to update role permissions
CREATE OR REPLACE FUNCTION public.update_role_permissions(p_role_id integer, p_permission_ids integer[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Remove existing permissions for the role
  DELETE FROM public.role_permissions WHERE role_id = p_role_id;

  -- Add new permissions
  IF array_length(p_permission_ids, 1) > 0 THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT p_role_id, unnest(p_permission_ids);
  END IF;
END;
$function$;

-- Function to insert a notification
CREATE OR REPLACE FUNCTION public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_id text DEFAULT NULL::text)
 RETURNS SETOF public.notifications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
  VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
  RETURNING *;
END;
$function$;


-- Default Data Insertion
-- Note: ON CONFLICT DO NOTHING prevents errors if the data already exists.

-- Insert Roles
INSERT INTO public.roles (role_name, description) VALUES
('Admin', 'Full system access'),
('Head Office Management', 'View-only access to all data and reports'),
('Staff Management', 'Manages a specific branch, its staff, and customers'),
('Staff', 'Data entry and viewing for a specific branch')
ON CONFLICT (role_name) DO NOTHING;

-- Insert Permissions
INSERT INTO public.permissions (name, category, description) VALUES
('dashboard_view_all', 'Dashboard', 'View aggregated dashboard for all branches'),
('dashboard_view_branch', 'Dashboard', 'View dashboard for assigned branch'),
('branches_view', 'Branches', 'View all branches'),
('branches_create', 'Branches', 'Create a new branch'),
('branches_update', 'Branches', 'Update an existing branch'),
('branches_delete', 'Branches', 'Delete a branch'),
('staff_view', 'Staff', 'View all staff members'),
('staff_create', 'Staff', 'Create a new staff member'),
('staff_update', 'Staff', 'Update a staff member'),
('staff_delete', 'Staff', 'Delete a staff member'),
('customers_view_all', 'Customers', 'View all individual customers'),
('customers_view_branch', 'Customers', 'View customers in assigned branch'),
('customers_create', 'Customers', 'Create a new individual customer'),
('customers_update', 'Customers', 'Update an individual customer'),
('customers_delete', 'Customers', 'Delete an individual customer'),
('customers_approve', 'Customers', 'Approve or reject new customer records'),
('bulk_meters_view_all', 'Bulk Meters', 'View all bulk meters'),
('bulk_meters_view_branch', 'Bulk Meters', 'View bulk meters in assigned branch'),
('bulk_meters_create', 'Bulk Meters', 'Create a new bulk meter'),
('bulk_meters_update', 'Bulk Meters', 'Update a bulk meter'),
('bulk_meters_delete', 'Bulk Meters', 'Delete a bulk meter'),
('bulk_meters_approve', 'Bulk Meters', 'Approve or reject new bulk meter records'),
('data_entry_access', 'Data Entry', 'Access the manual and CSV data entry pages'),
('meter_readings_view_all', 'Meter Readings', 'View all meter readings'),
('meter_readings_view_branch', 'Meter Readings', 'View readings in assigned branch'),
('meter_readings_create', 'Meter Readings', 'Create new meter readings'),
('reports_generate_all', 'Reports', 'Generate and download reports for all data'),
('reports_generate_branch', 'Reports', 'Generate and download reports for assigned branch'),
('permissions_view', 'Permissions', 'View roles and permissions'),
('permissions_update', 'Permissions', 'Update roles and permissions'),
('notifications_view', 'Notifications', 'View system notifications'),
('notifications_create', 'Notifications', 'Send system notifications'),
('settings_view', 'Settings', 'View application settings'),
('settings_update', 'Settings', 'Update application settings'),
('tariffs_view', 'Tariffs', 'View tariff rates'),
('tariffs_update', 'Tariffs', 'Update tariff rates')
ON CONFLICT (name) DO NOTHING;

-- Set up default permissions for each role
DO $$
DECLARE
    admin_role_id INTEGER;
    ho_mgmt_role_id INTEGER;
    staff_mgmt_role_id INTEGER;
    staff_role_id INTEGER;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.roles WHERE role_name = 'Admin';
    SELECT id INTO ho_mgmt_role_id FROM public.roles WHERE role_name = 'Head Office Management';
    SELECT id INTO staff_mgmt_role_id FROM public.roles WHERE role_name = 'Staff Management';
    SELECT id INTO staff_role_id FROM public.roles WHERE role_name = 'Staff';

    -- Clear existing permissions to ensure a clean slate
    DELETE FROM public.role_permissions WHERE role_id IN (admin_role_id, ho_mgmt_role_id, staff_mgmt_role_id, staff_role_id);

    -- Admin (all permissions)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role_id, p.id FROM public.permissions p
    ON CONFLICT DO NOTHING;

    -- Head Office Management (View-only permissions for everything)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT ho_mgmt_role_id, p.id FROM public.permissions p
    WHERE p.name LIKE '%_view%' OR p.name LIKE 'reports_generate_all' OR p.name LIKE 'notifications_%'
    ON CONFLICT DO NOTHING;

    -- Staff Management (CRUD on their branch, view reports for their branch)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT staff_mgmt_role_id, p.id FROM public.permissions p
    WHERE p.name IN (
        'dashboard_view_branch', 'staff_create', 'staff_update', 'staff_delete',
        'customers_view_branch', 'customers_create', 'customers_update', 'customers_delete',
        'bulk_meters_view_branch', 'bulk_meters_create', 'bulk_meters_update', 'bulk_meters_delete',
        'data_entry_access', 'meter_readings_view_branch', 'meter_readings_create',
        'reports_generate_branch', 'notifications_view', 'customers_approve', 'bulk_meters_approve'
    )
    ON CONFLICT DO NOTHING;

    -- Staff (Data entry and view for their branch)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT staff_role_id, p.id FROM public.permissions p
    WHERE p.name IN (
        'dashboard_view_branch', 'customers_view_branch', 'bulk_meters_view_branch',
        'data_entry_access', 'meter_readings_view_branch', 'meter_readings_create', 'reports_generate_branch',
        'notifications_view'
    )
    ON CONFLICT DO NOTHING;
END $$;


-- Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read roles" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read permissions" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read role_permissions" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');

-- More restrictive policies for write operations, typically limited to service roles or specific admin functions.
CREATE POLICY "Deny all writes to roles" ON public.roles FOR ALL USING (false);
CREATE POLICY "Deny all writes to permissions" ON public.permissions FOR ALL USING (false);
CREATE POLICY "Deny all writes to role_permissions" ON public.role_permissions FOR ALL USING (false);

-- You might have a specific admin role that can modify these tables. Example:
-- CREATE POLICY "Allow admins to modify roles" ON public.roles FOR ALL USING (auth.jwt()->>'role' = 'admin_user_role') WITH CHECK (auth.jwt()->>'role' = 'admin_user_role');


--
-- PostgreSQL database dump complete
--

