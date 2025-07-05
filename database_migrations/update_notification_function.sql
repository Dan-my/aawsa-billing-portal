
-- Drop the existing function if it exists to avoid conflicts.
-- This is safe because we are replacing it with the corrected version.
DROP FUNCTION IF EXISTS public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_name text);
DROP FUNCTION IF EXISTS public.insert_notification(p_title text, p_message text, p_sender_name text, p_target_branch_id uuid);


-- Create the new, corrected function that uses target_branch_id (UUID).
-- This function inserts a new notification into the public.notifications table.
--
-- Parameters:
-- p_title: The title of the notification.
-- p_message: The main content of the notification.
-- p_sender_name: The name of the user sending the notification.
-- p_target_branch_id: The unique ID (UUID) of the target branch. Can be NULL for notifications sent to all staff.
--
-- Returns:
-- A single row from the public.notifications table representing the newly created notification.
CREATE OR REPLACE FUNCTION public.insert_notification(
    p_title text,
    p_message text,
    p_sender_name text,
    p_target_branch_id uuid
)
RETURNS SETOF public.notifications
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING id, created_at, title, message, sender_name, target_branch_id;
END;
$$;
