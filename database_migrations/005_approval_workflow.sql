-- Step 1: Add new status values to the individual_customer_status enum
-- The 'IF NOT EXISTS' clause prevents an error if the values have already been added.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Pending Approval' AND enumtypid = 'individual_customer_status'::regtype) THEN
    ALTER TYPE individual_customer_status ADD VALUE 'Pending Approval' AFTER 'Suspended';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Rejected' AND enumtypid = 'individual_customer_status'::regtype) THEN
    ALTER TYPE individual_customer_status ADD VALUE 'Rejected' AFTER 'Pending Approval';
  END IF;
END$$;


-- Step 2: Add new columns to the individual_customers table for tracking approvals
-- The 'IF NOT EXISTS' check ensures the script can be run multiple times without error.

-- Column to store the ID of the staff member who approved the record.
-- Corrected data type to UUID to match the staff_members.id column.
ALTER TABLE public.individual_customers
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Column to store the timestamp of when the approval happened.
ALTER TABLE public.individual_customers
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add a foreign key constraint to link 'approved_by' to the 'staff_members' table.
-- This ensures data integrity.
-- A check is added to avoid adding the constraint if it already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_approved_by_staff' AND conrelid = 'public.individual_customers'::regclass
  ) THEN
    ALTER TABLE public.individual_customers
    ADD CONSTRAINT fk_approved_by_staff
    FOREIGN KEY (approved_by)
    REFERENCES public.staff_members(id)
    ON DELETE SET NULL; -- If the approving staff member is deleted, keep the customer record but nullify the reference.
  END IF;
END$$;

-- Add a comment to the new column for clarity in database tools.
COMMENT ON COLUMN public.individual_customers.approved_by IS 'Foreign key referencing the staff member who approved this customer record.';
