-- Migration: Add Approval Workflow for Individual Customers
-- This script adds the necessary database changes to support a multi-step
-- approval process for newly created individual customer records.

-- Step 1: Add new status values to the 'individual_customer_status_enum'.
-- We use a DO block with exception handling to safely add the new values,
-- preventing errors if the script is run more than once.
DO $$
BEGIN
  -- Add 'Pending Approval' status for newly created records awaiting review.
  ALTER TYPE public.individual_customer_status_enum ADD VALUE IF NOT EXISTS 'Pending Approval';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Value "Pending Approval" already exists in enum type, skipping.';
END
$$;

DO $$
BEGIN
  -- Add 'Rejected' status for records that fail the review process.
  ALTER TYPE public.individual_customer_status_enum ADD VALUE IF NOT EXISTS 'Rejected';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Value "Rejected" already exists in enum type, skipping.';
END
$$;


-- Step 2: Add new columns to the 'individual_customers' table to track approvals.

-- Add 'approved_by' column to store the ID of the staff member who approves the record.
-- This column is nullable because it will be empty until an approval occurs.
-- It references the 'id' in the 'staff_members' table.
ALTER TABLE public.individual_customers
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.staff_members(id) ON DELETE SET NULL;

-- Add 'approved_at' column to store the timestamp of when the approval happened.
-- This column is also nullable and will be populated upon approval.
ALTER TABLE public.individual_customers
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add comments to the new columns for clarity within the database schema.
COMMENT ON COLUMN public.individual_customers.approved_by IS 'ID of the staff member who approved this customer record.';
COMMENT ON COLUMN public.individual_customers.approved_at IS 'Timestamp of when the customer record was approved.';

