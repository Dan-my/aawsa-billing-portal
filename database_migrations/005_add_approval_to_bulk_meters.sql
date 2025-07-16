-- Comprehensive Migration to fix staff_members.id type and add approval columns

-- This script corrects a fundamental type mismatch. The 'staff_members.id' column
-- was previously 'text' but needs to be 'uuid' to correctly reference user IDs
-- and to be referenced by other tables.

-- Step 1: Drop existing foreign key on staff_members.role_id if it exists, as it might depend on the primary key.
-- We will re-add it later.
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_role_id_fkey;

-- Step 2: Change the data type of the 'id' column in 'staff_members' from text to uuid.
-- This aligns it with the auth.users.id type.
ALTER TABLE public.staff_members
ALTER COLUMN id TYPE uuid USING id::uuid;

-- Step 3: Re-add the foreign key constraint for the role_id.
ALTER TABLE public.staff_members
ADD CONSTRAINT staff_members_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES public.roles(id)
ON DELETE SET NULL;

-- Step 4: Add 'approved_by' and 'approved_at' columns to the 'bulk_meters' table.
-- The approved_by column is correctly typed as uuid now.
ALTER TABLE public.bulk_meters ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.bulk_meters ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Step 5: Add the foreign key constraint from bulk_meters to the now-corrected staff_members table.
-- First, drop the constraint if it exists from a previous failed attempt.
ALTER TABLE public.bulk_meters DROP CONSTRAINT IF EXISTS fk_bulk_meters_approved_by_staff;

-- Now, add the corrected foreign key constraint.
ALTER TABLE public.bulk_meters
ADD CONSTRAINT fk_bulk_meters_approved_by_staff
FOREIGN KEY (approved_by)
REFERENCES public.staff_members(id)
ON DELETE SET NULL;
