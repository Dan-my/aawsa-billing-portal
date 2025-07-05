-- Drop the existing function first to remove the dependency on the table.
DROP FUNCTION IF EXISTS public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_id uuid);
DROP FUNCTION IF EXISTS public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_name text);

-- Now it's safe to drop the table.
DROP TABLE IF EXISTS public.notifications;

-- Create the new notifications table with the correct foreign key structure.
-- The key change is that target_branch_id is now TEXT to match branches.id.
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    target_branch_id TEXT, -- Changed from UUID to TEXT

    CONSTRAINT fk_branch
        FOREIGN KEY(target_branch_id)
        REFERENCES public.branches(id)
        ON DELETE SET NULL
);

-- Re-create the database function with the correct parameter type for p_target_branch_id.
CREATE OR REPLACE FUNCTION public.insert_notification(
    p_title text,
    p_message text,
    p_sender_name text,
    p_target_branch_id text -- Changed from UUID to TEXT
)
RETURNS SETOF public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING id, created_at, title, message, sender_name, target_branch_id;
END;
$$;

-- Finally, re-enable Row Level Security and apply the necessary access policies.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to read notifications" ON public.notifications;

CREATE POLICY "Allow service role full access"
ON public.notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);
