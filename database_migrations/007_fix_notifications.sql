-- Drop existing functions to resolve any signature conflicts.
-- It is safe to run these DROP commands even if the functions do not exist.
DROP FUNCTION IF EXISTS insert_notification(text, text, text, text);
DROP FUNCTION IF EXISTS insert_notification(text, text, text, uuid);

-- Create the definitive function with the correct signature.
-- This version uses uuid for the branch ID, which is the correct type.
-- It also includes `SECURITY DEFINER` to work correctly with Row-Level Security policies.
CREATE OR REPLACE FUNCTION insert_notification(
    p_title text,
    p_message text,
    p_sender_name text,
    p_target_branch_id uuid
)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    title text,
    message text,
    sender_name text,
    target_branch_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING
        notifications.id,
        notifications.created_at,
        notifications.title,
        notifications.message,
        notifications.sender_name,
        notifications.target_branch_id;
END;
$$;
