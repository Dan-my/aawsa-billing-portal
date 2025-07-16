-- Comprehensive Migration to fix staff_members.id type and add approval columns
-- This version handles the RLS policy dependency that was preventing the column type change.

-- Step 1: Temporarily drop the RLS policy that depends on the 'id' column.
-- We will re-create it at the end.
DROP POLICY IF EXISTS "Allow individual user to read their own data" ON public.staff_members;

-- Step 2: Drop existing foreign key on staff_members.role_id if it exists.
-- This is good practice when altering the primary key it might relate to.
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_role_id_fkey;

-- Step 3: Change the data type of the 'id' column in 'staff_members' from text to uuid.
-- This aligns it with the auth.users.id type.
ALTER TABLE public.staff_members
ALTER COLUMN id TYPE uuid USING id::uuid;

-- Step 4: Re-add the foreign key constraint for the role_id.
ALTER TABLE public.staff_members
ADD CONSTRAINT staff_members_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES public.roles(id)
ON DELETE SET NULL;

-- Step 5: Re-create the RLS policy that we dropped earlier.
-- This policy allows users to see their own staff record.
CREATE POLICY "Allow individual user to read their own data"
ON public.staff_members
FOR SELECT
USING (auth.uid() = id);

-- Step 6: Add 'approved_by' and 'approved_at' columns to the 'bulk_meters' table.
ALTER TABLE public.bulk_meters ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.bulk_meters ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Step 7: Add the foreign key constraint from bulk_meters to the now-corrected staff_members table.
-- First, drop the constraint if it exists from a previous failed attempt.
ALTER TABLE public.bulk_meters DROP CONSTRAINT IF EXISTS fk_bulk_meters_approved_by_staff;

-- Now, add the corrected foreign key constraint.
ALTER TABLE public.bulk_meters
ADD CONSTRAINT fk_bulk_meters_approved_by_staff
FOREIGN KEY (approved_by)
REFERENCES public.staff_members(id)
ON DELETE SET NULL;
