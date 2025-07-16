-- Add approval tracking columns to the bulk_meters table.
-- This allows the application to record which staff member approved or rejected a new bulk meter record and when.

-- Add the 'approved_by' column to store the UUID of the staff member.
-- This column will reference the 'id' in the 'staff_members' table.
ALTER TABLE public.bulk_meters
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add the 'approved_at' column to store the timestamp of the approval/rejection.
ALTER TABLE public.bulk_meters
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add a foreign key constraint to ensure 'approved_by' refers to a valid staff member.
-- This maintains data integrity. It is named to be easily identifiable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_bulk_meters_approved_by_staff' AND conrelid = 'public.bulk_meters'::regclass
  ) THEN
    ALTER TABLE public.bulk_meters
    ADD CONSTRAINT fk_bulk_meters_approved_by_staff
    FOREIGN KEY (approved_by)
    REFERENCES public.staff_members(id)
    ON DELETE SET NULL; -- If the staff member is deleted, keep the record but nullify the approver.
  END IF;
END;
$$;
