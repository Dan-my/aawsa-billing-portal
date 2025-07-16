
DO $$
BEGIN
    -- Add approved_by column if it doesn't exist, with the correct uuid type
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bulk_meters' AND column_name='approved_by') THEN
        ALTER TABLE public.bulk_meters ADD COLUMN approved_by uuid;
    END IF;

    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bulk_meters' AND column_name='approved_at') THEN
        ALTER TABLE public.bulk_meters ADD COLUMN approved_at timestamptz;
    END IF;

    -- Add the foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_bulk_meters_approved_by_staff'
    ) THEN
        ALTER TABLE public.bulk_meters
        ADD CONSTRAINT fk_bulk_meters_approved_by_staff
        FOREIGN KEY (approved_by)
        REFERENCES public.staff_members(id)
        ON DELETE SET NULL;
    END IF;
END $$;
