-- Enable the UUID generation extension if it's not already enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Type: branch_status
--
CREATE TYPE public.branch_status AS ENUM (
    'Active',
    'Inactive'
);

--
-- Type: bulk_meter_status
--
CREATE TYPE public.bulk_meter_status AS ENUM (
    'Active',
    'Maintenance',
    'Decommissioned',
    'Pending Approval',
    'Rejected'
);

--
-- Type: customer_type
--
CREATE TYPE public.customer_type AS ENUM (
    'Domestic',
    'Non-domestic'
);

--
-- Type: individual_customer_status
--
CREATE TYPE public.individual_customer_status AS ENUM (
    'Active',
    'Inactive',
    'Suspended',
    'Pending Approval',
    'Rejected'
);

--
-- Type: payment_status
--
CREATE TYPE public.payment_status AS ENUM (
    'Paid',
    'Unpaid',
    'Pending'
);

--
-- Type: payment_method
--
CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Bank Transfer',
    'Mobile Money',
    'Online Payment',
    'Other'
);

--
-- Type: report_name
--
CREATE TYPE public.report_name AS ENUM (
    'CustomerDataExport',
    'BulkMeterDataExport',
    'BillingSummary',
    'WaterUsageReport',
    'PaymentHistoryReport',
    'MeterReadingAccuracy'
);

--
-- Type: report_status
--
CREATE TYPE public.report_status AS ENUM (
    'Generated',
    'Pending',
    'Failed',
    'Archived'
);

--
-- Type: sewerage_connection
--
CREATE TYPE public.sewerage_connection AS ENUM (
    'Yes',
    'No'
);

--
-- Type: staff_status
--
CREATE TYPE public.staff_status AS ENUM (
    'Active',
    'Inactive',
    'On Leave'
);


--
-- Table: branches
--
CREATE TABLE public.branches (
    id text DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    "contactPerson" text,
    "contactPhone" numeric,
    updated_at timestamp with time zone,
    status public.branch_status NOT NULL
);

ALTER TABLE public.branches OWNER TO postgres;

--
-- Table: roles
--
CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.roles OWNER TO postgres;

--
-- Sequence: roles_id_seq
--
CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

--
-- Table: staff_members
--
CREATE TABLE public.staff_members (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    password text,
    role text NOT NULL,
    branch text NOT NULL,
    status public.staff_status NOT NULL,
    name text,
    phone text,
    hire_date date,
    updated_at timestamp with time zone,
    role_id integer
);

ALTER TABLE public.staff_members OWNER TO postgres;

--
-- Table: bulk_meters
--
CREATE TABLE public.bulk_meters (
    "customerKeyNumber" text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    name text,
    "contractNumber" text,
    "meterSize" numeric,
    "meterNumber" text,
    "previousReading" numeric,
    "currentReading" numeric,
    month text,
    "specificArea" text,
    "subCity" text,
    woreda text,
    status public.bulk_meter_status DEFAULT 'Active'::public.bulk_meter_status,
    "paymentStatus" public.payment_status DEFAULT 'Unpaid'::public.payment_status,
    "outStandingbill" numeric DEFAULT 0,
    "branch_id" text,
    "updatedAt" timestamp with time zone,
    bulk_usage numeric,
    total_bulk_bill numeric,
    difference_usage numeric,
    difference_bill numeric,
    x_coordinate numeric,
    y_coordinate numeric,
    charge_group public.customer_type DEFAULT 'Non-domestic'::public.customer_type NOT NULL,
    sewerage_connection public.sewerage_connection DEFAULT 'No'::public.sewerage_connection NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone
);

ALTER TABLE public.bulk_meters OWNER TO postgres;

--
-- Table: individual_customers
--
CREATE TABLE public.individual_customers (
    "customerKeyNumber" text NOT NULL,
    name text NOT NULL,
    "contractNumber" text,
    "customerType" public.customer_type NOT NULL,
    "bookNumber" text,
    ordinal numeric,
    "meterSize" numeric,
    "meterNumber" text,
    "previousReading" numeric,
    "currentReading" numeric,
    month text,
    "specificArea" text,
    "subCity" text,
    woreda text,
    "sewerageConnection" public.sewerage_connection,
    "assignedBulkMeterId" text,
    "branch_id" text,
    status public.individual_customer_status DEFAULT 'Active'::public.individual_customer_status,
    "paymentStatus" public.payment_status DEFAULT 'Unpaid'::public.payment_status,
    "calculatedBill" numeric DEFAULT 0,
    arrears numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    approved_by uuid,
    approved_at timestamp with time zone
);

ALTER TABLE public.individual_customers OWNER TO postgres;

--
-- Table: bills
--
CREATE TABLE public.bills (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    individual_customer_id text,
    bulk_meter_id text,
    bill_period_start_date date NOT NULL,
    bill_period_end_date date NOT NULL,
    month_year text NOT NULL,
    previous_reading_value numeric NOT NULL,
    current_reading_value numeric NOT NULL,
    usage_m3 numeric,
    difference_usage numeric,
    base_water_charge numeric NOT NULL,
    sewerage_charge numeric,
    maintenance_fee numeric,
    sanitation_fee numeric,
    meter_rent numeric,
    balance_carried_forward numeric,
    total_amount_due numeric NOT NULL,
    amount_paid numeric,
    balance_due numeric,
    due_date date NOT NULL,
    payment_status public.payment_status DEFAULT 'Unpaid'::public.payment_status NOT NULL,
    bill_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

ALTER TABLE public.bills OWNER TO postgres;

--
-- Table: bulk_meter_readings
--
CREATE TABLE public.bulk_meter_readings (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    bulk_meter_id text NOT NULL,
    reader_staff_id uuid,
    reading_date date DEFAULT now() NOT NULL,
    month_year text NOT NULL,
    reading_value numeric NOT NULL,
    is_estimate boolean,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

ALTER TABLE public.bulk_meter_readings OWNER TO postgres;

--
-- Table: individual_customer_readings
--
CREATE TABLE public.individual_customer_readings (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    individual_customer_id text NOT NULL,
    reader_staff_id uuid,
    reading_date date DEFAULT now() NOT NULL,
    month_year text NOT NULL,
    reading_value numeric NOT NULL,
    is_estimate boolean,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

ALTER TABLE public.individual_customer_readings OWNER TO postgres;

--
-- Table: notifications
--
CREATE TABLE public.notifications (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    sender_name text NOT NULL,
    target_branch_id text
);

ALTER TABLE public.notifications OWNER TO postgres;

--
-- Table: payments
--
CREATE TABLE public.payments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    bill_id uuid,
    individual_customer_id text,
    payment_date date DEFAULT now() NOT NULL,
    amount_paid numeric NOT NULL,
    payment_method public.payment_method NOT NULL,
    transaction_reference text,
    processed_by_staff_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

ALTER TABLE public.payments OWNER TO postgres;

--
-- Table: permissions
--
CREATE TABLE public.permissions (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.permissions OWNER TO postgres;

--
-- Sequence: permissions_id_seq
--
CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;
ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;

--
-- Table: reports
--
CREATE TABLE public.reports (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    report_name public.report_name NOT NULL,
    description text,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    generated_by_staff_id uuid,
    parameters jsonb,
    file_format text,
    file_name text,
    status public.report_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

ALTER TABLE public.reports OWNER TO postgres;

--
-- Table: role_permissions
--
CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.role_permissions OWNER TO postgres;


--
-- Table: tariffs
--
CREATE TABLE public.tariffs (
    customer_type text NOT NULL,
    year integer NOT NULL,
    tiers jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    maintenance_percentage numeric DEFAULT 0.01 NOT NULL,
    sanitation_percentage numeric NOT NULL,
    sewerage_rate_per_m3 numeric NOT NULL,
    meter_rent_prices jsonb,
    vat_rate numeric DEFAULT 0.15 NOT NULL,
    domestic_vat_threshold_m3 numeric DEFAULT 15 NOT NULL
);

ALTER TABLE public.tariffs OWNER TO postgres;

--
-- Set sequence values
--
ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);
ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);

--
-- Insert default data
--
INSERT INTO public.roles (id, role_name, description, created_at, updated_at) VALUES (1, 'Admin', 'Has unrestricted access to all system features and data.', '2024-05-24 20:13:30.406981+00', '2024-05-24 20:13:30.406981+00');
INSERT INTO public.roles (id, role_name, description, created_at, updated_at) VALUES (2, 'Head Office Management', 'High-level oversight and monitoring without editing capabilities.', '2024-05-24 20:13:30.406981+00', '2024-05-24 20:13:30.406981+00');
INSERT INTO public.roles (id, role_name, description, created_at, updated_at) VALUES (3, 'Staff Management', 'Manages day-to-day operations of a specific branch.', '2024-05-24 20:13:30.406981+00', '2024-05-24 20:13:30.406981+00');
INSERT INTO public.roles (id, role_name, description, created_at, updated_at) VALUES (4, 'Staff', 'Focused on data entry and viewing branch-level information.', '2024-05-24 20:13:30.406981+00', '2024-05-24 20:13:30.406981+00');

INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (1, 'dashboard_view_all', 'View the main dashboard with aggregated data from all branches.', 'Dashboard', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (2, 'dashboard_view_branch', 'View a dashboard filtered to the user''s assigned branch.', 'Dashboard', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (3, 'branches_view', 'View the list of all branches.', 'Branch Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (4, 'branches_create', 'Create new branches.', 'Branch Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (5, 'branches_update', 'Update details of any branch.', 'Branch Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (6, 'branches_delete', 'Delete any branch.', 'Branch Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (7, 'staff_view', 'View all staff members across all branches.', 'Staff Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (8, 'staff_create', 'Create new staff members.', 'Staff Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (9, 'staff_update', 'Update any staff member''s details.', 'Staff Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (10, 'staff_delete', 'Delete any staff member.', 'Staff Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (11, 'permissions_view', 'View the roles and permissions configuration page.', 'Permissions', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (12, 'permissions_update', 'Modify the permissions assigned to any role.', 'Permissions', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (13, 'customers_view_all', 'View all individual customers across all branches.', 'Customer Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (14, 'customers_view_branch', 'View individual customers only within the user''s branch.', 'Customer Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (15, 'customers_create', 'Create new individual customers.', 'Customer Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (16, 'customers_update', 'Update details of any individual customer.', 'Customer Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (17, 'customers_delete', 'Delete any individual customer.', 'Customer Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (18, 'bulk_meters_view_all', 'View all bulk meters across all branches.', 'Bulk Meter Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (19, 'bulk_meters_view_branch', 'View bulk meters only within the user''s branch.', 'Bulk Meter Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (20, 'bulk_meters_create', 'Create new bulk meters.', 'Bulk Meter Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (21, 'bulk_meters_update', 'Update details of any bulk meter.', 'Bulk Meter Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (22, 'bulk_meters_delete', 'Delete any bulk meter.', 'Bulk Meter Management', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (23, 'data_entry_access', 'Access the manual and CSV data entry pages.', 'Data Entry', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (24, 'reports_generate_all', 'Generate and view reports with data from all branches.', 'Reports', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (25, 'reports_generate_branch', 'Generate and view reports filtered to the user''s branch data.', 'Reports', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (26, 'notifications_view', 'View the notifications page.', 'Notifications', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (27, 'notifications_create', 'Send notifications to all staff or specific branches.', 'Notifications', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (28, 'tariffs_view', 'View the tariff management page.', 'Settings', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (29, 'tariffs_update', 'Update tariff rates and billing rules.', 'Settings', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (30, 'settings_view', 'View the application settings page.', 'Settings', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (31, 'settings_update', 'Update global application settings.', 'Settings', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (32, 'customers_approve', 'Approve or reject new customer records.', 'Approvals', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (33, 'bulk_meters_approve', 'Approve or reject new bulk meter records.', 'Approvals', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (34, 'meter_readings_view_all', 'View all meter readings from any branch.', 'Meter Readings', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (35, 'meter_readings_view_branch', 'View meter readings only for the user''s branch.', 'Meter Readings', '2024-05-24 20:15:53.308332+00');
INSERT INTO public.permissions (id, name, description, category, created_at) VALUES (36, 'meter_readings_create', 'Create new meter readings.', 'Meter Readings', '2024-05-24 20:15:53.308332+00');

INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 1, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 3, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 7, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 13, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 18, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 24, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 26, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (2, 27, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 2, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 8, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 9, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 10, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 14, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 15, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 16, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 17, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 19, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 20, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 21, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 22, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 23, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 25, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 26, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 27, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 32, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 33, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 35, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (3, 36, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 2, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 14, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 19, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 23, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 25, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 35, '2024-05-24 20:19:07.414436+00');
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES (4, 36, '2024-05-24 20:19:07.414436+00');

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);
SELECT pg_catalog.setval('public.permissions_id_seq', 36, true);

--
-- Set Primary Keys
--
ALTER TABLE ONLY public.bills ADD CONSTRAINT bills_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.branches ADD CONSTRAINT branches_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bulk_meter_readings ADD CONSTRAINT bulk_meter_readings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bulk_meters ADD CONSTRAINT bulk_meters_pkey PRIMARY KEY ("customerKeyNumber");
ALTER TABLE ONLY public.individual_customer_readings ADD CONSTRAINT individual_customer_readings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.individual_customers ADD CONSTRAINT individual_customers_pkey PRIMARY KEY ("customerKeyNumber");
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.permissions ADD CONSTRAINT permissions_name_key UNIQUE (name);
ALTER TABLE ONLY public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reports ADD CONSTRAINT reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);
ALTER TABLE ONLY public.staff_members ADD CONSTRAINT staff_members_email_key UNIQUE (email);
ALTER TABLE ONLY public.staff_members ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tariffs ADD CONSTRAINT tariffs_pkey PRIMARY KEY (customer_type, year);

--
-- Set Foreign Keys
--
ALTER TABLE ONLY public.bills ADD CONSTRAINT bills_bulk_meter_id_fkey FOREIGN KEY (bulk_meter_id) REFERENCES public.bulk_meters("customerKeyNumber") ON DELETE SET NULL;
ALTER TABLE ONLY public.bills ADD CONSTRAINT bills_individual_customer_id_fkey FOREIGN KEY (individual_customer_id) REFERENCES public.individual_customers("customerKeyNumber") ON DELETE SET NULL;
ALTER TABLE ONLY public.bulk_meter_readings ADD CONSTRAINT bulk_meter_readings_bulk_meter_id_fkey FOREIGN KEY (bulk_meter_id) REFERENCES public.bulk_meters("customerKeyNumber") ON DELETE CASCADE;
ALTER TABLE ONLY public.bulk_meter_readings ADD CONSTRAINT bulk_meter_readings_reader_staff_id_fkey FOREIGN KEY (reader_staff_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.bulk_meters ADD CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.bulk_meters ADD CONSTRAINT fk_bulk_meters_approved_by_staff FOREIGN KEY (approved_by) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.individual_customer_readings ADD CONSTRAINT individual_customer_readings_individual_customer_id_fkey FOREIGN KEY (individual_customer_id) REFERENCES public.individual_customers("customerKeyNumber") ON DELETE CASCADE;
ALTER TABLE ONLY public.individual_customer_readings ADD CONSTRAINT individual_customer_readings_reader_staff_id_fkey FOREIGN KEY (reader_staff_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.individual_customers ADD CONSTRAINT fk_assigned_bulk_meter FOREIGN KEY ("assignedBulkMeterId") REFERENCES public.bulk_meters("customerKeyNumber") ON DELETE SET NULL;
ALTER TABLE ONLY public.individual_customers ADD CONSTRAINT individual_customers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.individual_customers ADD CONSTRAINT individual_customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_target_branch_id_fkey FOREIGN KEY (target_branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_individual_customer_id_fkey FOREIGN KEY (individual_customer_id) REFERENCES public.individual_customers("customerKeyNumber") ON DELETE SET NULL;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_processed_by_staff_id_fkey FOREIGN KEY (processed_by_staff_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.reports ADD CONSTRAINT reports_generated_by_staff_id_fkey FOREIGN KEY (generated_by_staff_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.staff_members ADD CONSTRAINT staff_members_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;

--
-- Create Functions
--
CREATE OR REPLACE FUNCTION public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_id text DEFAULT NULL::text)
RETURNS SETOF public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING *;
END;
$$;

ALTER FUNCTION public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_id text) OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.update_role_permissions(p_role_id integer, p_permission_ids integer[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete existing permissions for the role
    DELETE FROM public.role_permissions
    WHERE role_id = p_role_id;

    -- Insert new permissions if any are provided
    IF array_length(p_permission_ids, 1) > 0 THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT p_role_id, unnest(p_permission_ids);
    END IF;
END;
$$;

ALTER FUNCTION public.update_role_permissions(p_role_id integer, p_permission_ids integer[]) OWNER TO postgres;

--
-- Enable Row-Level Security
--
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_customer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

--
-- Define Policies
--
CREATE POLICY "Allow public read access" ON public.branches FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.bulk_meter_readings FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.bulk_meters FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.individual_customer_readings FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.individual_customers FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.notifications FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.permissions FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.roles FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.staff_members FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.tariffs FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.bills FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.payments FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.reports FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public read access" ON public.role_permissions FOR SELECT TO PUBLIC USING (true);

-- Admin users can do anything. This policy is simplified and assumes an 'Admin' role exists.
-- You might want to lock this down further based on your application's logic.
CREATE POLICY "Allow full access for admin users" ON public.branches FOR ALL USING ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin') WITH CHECK ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin');
CREATE POLICY "Allow full access for admin users" ON public.bulk_meters FOR ALL USING ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin') WITH CHECK ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin');
CREATE POLICY "Allow full access for admin users" ON public.individual_customers FOR ALL USING ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin') WITH CHECK ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin');
CREATE POLICY "Allow full access for admin users" ON public.staff_members FOR ALL USING ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin') WITH CHECK ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin');
CREATE POLICY "Allow full access for admin users on role_permissions" ON public.role_permissions FOR ALL USING ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin') WITH CHECK ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Admin');

-- These policies are examples and may need to be adjusted based on how you handle user sessions in standard PostgreSQL.
-- The concept of `auth.email()` is Supabase-specific. You would need to replace it with a session variable, e.g., `current_setting('app.user.email', true)`.
-- This requires setting the variable at the beginning of each database session. The app code does not currently do this.
-- For simplicity, the following policies are commented out. The "public read" and "admin full access" policies will be used instead.
/*
CREATE POLICY "Allow staff managers to modify their own branch data" ON public.branches FOR ALL TO PUBLIC USING ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Staff Management' AND id = (SELECT branch FROM public.staff_members WHERE email = current_user)) WITH CHECK ((SELECT role FROM public.staff_members WHERE email = current_user) = 'Staff Management' AND id = (SELECT branch FROM public.staff_members WHERE email = current_user));
CREATE POLICY "Allow staff to create bulk meter readings in their branch" ON public.bulk_meter_readings FOR INSERT TO PUBLIC WITH CHECK (EXISTS (SELECT 1 FROM public.bulk_meters bm JOIN public.staff_members sm ON bm.branch_id = sm.branch WHERE sm.email = current_user AND bm."customerKeyNumber" = bulk_meter_id));
CREATE POLICY "Allow staff to create individual customer readings in their branch" ON public.individual_customer_readings FOR INSERT TO PUBLIC WITH CHECK (EXISTS (SELECT 1 FROM public.individual_customers ic JOIN public.staff_members sm ON ic.branch_id = sm.branch WHERE sm.email = current_user AND ic."customerKeyNumber" = individual_customer_id));
CREATE POLICY "Allow users to manage data in their own branch" ON public.bulk_meters FOR ALL TO PUBLIC USING (branch_id = (SELECT branch FROM public.staff_members WHERE email = current_user)) WITH CHECK (branch_id = (SELECT branch FROM public.staff_members WHERE email = current_user));
CREATE POLICY "Allow users to manage data in their own branch" ON public.individual_customers FOR ALL TO PUBLIC USING (branch_id = (SELECT branch FROM public.staff_members WHERE email = current_user)) WITH CHECK (branch_id = (SELECT branch FROM public.staff_members WHERE email = current_user));
CREATE POLICY "Allow users to manage staff in their own branch" ON public.staff_members FOR ALL TO PUBLIC USING (branch = (SELECT branch FROM public.staff_members WHERE email = current_user)) WITH CHECK (branch = (SELECT branch FROM public.staff_members WHERE email = current_user));
*/

  