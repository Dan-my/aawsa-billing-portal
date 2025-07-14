
-- This script adds an approval workflow for new customer creation.
-- It adds new statuses and tracking columns to the individual_customers table.

-- Add new statuses 'Pending Approval' and 'Rejected' to the enum type for individual customers.
-- This block ensures the script can be run multiple times without causing "type exists" errors.
DO $$
BEGIN
    -- Check if 'Pending Approval' exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.individual_customer_status'::regtype AND enumlabel = 'Pending Approval') THEN
        ALTER TYPE public.individual_customer_status ADD VALUE 'Pending Approval' AFTER 'Suspended';
    END IF;

    -- Check if 'Rejected' exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.individual_customer_status'::regtype AND enumlabel = 'Rejected') THEN
        ALTER TYPE public.individual_customer_status ADD VALUE 'Rejected' AFTER 'Pending Approval';
    END IF;
END;
$$;


-- Add tracking columns to the individual_customers table.
-- These will store who approved a customer record and when.
ALTER TABLE public.individual_customers
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamptz;


-- Drop the foreign key constraint if it exists, to ensure a clean re-creation.
ALTER TABLE public.individual_customers
DROP CONSTRAINT IF EXISTS individual_customers_approved_by_fkey;

-- Add a foreign key constraint to link the approver to a staff member.
-- This ensures data integrity.
ALTER TABLE public.individual_customers
ADD CONSTRAINT individual_customers_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES public.staff_members(id) ON DELETE SET NULL;
