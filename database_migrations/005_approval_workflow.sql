-- Step 1: Alter the CHECK constraint to include new status values
-- First, we drop the existing constraint. The name might vary, but 'individual_customers_status_check' is a common default.
-- You can verify the exact name in your Supabase table definitions if this fails.
ALTER TABLE public.individual_customers
DROP CONSTRAINT IF EXISTS individual_customers_status_check;

-- Next, we add the constraint back with the new allowed values.
ALTER TABLE public.individual_customers
ADD CONSTRAINT individual_customers_status_check
CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Pending Approval', 'Rejected'));


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
