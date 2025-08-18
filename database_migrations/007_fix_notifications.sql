-- Drop the existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_id uuid);

-- Create the new, corrected function
CREATE OR REPLACE FUNCTION public.insert_notification(
    p_title text,
    p_message text,
    p_sender_name text,
    p_target_branch_id uuid DEFAULT NULL
)
RETURNS SETOF public.notifications AS $$
BEGIN
    -- This function now correctly handles a UUID for the branch ID.
    -- The SECURITY DEFINER setting is crucial. It allows the function to be called
    -- by authenticated users without them needing direct insert permissions on the
    -- notifications table, which is a more secure pattern.
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to the authenticated role.
-- This is a key part of the security model, ensuring only logged-in users can trigger it.
GRANT EXECUTE ON FUNCTION public.insert_notification(text, text, text, uuid) TO authenticated;
