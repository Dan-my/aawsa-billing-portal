-- This script updates the database function for sending notifications.
-- It ensures the function accepts a branch ID instead of a branch name,
-- making the system more robust and fixing a critical bug.

-- Step 1: Drop the old function if it exists to avoid conflicts.
-- The old function might have a different signature (using p_target_branch_name).
-- NOTE: If this DROP command fails, you may need to find the exact old function
-- signature in your Supabase dashboard's "Database -> Functions" section and
-- update the parameter types below (e.g., text, text, text, text).
DROP FUNCTION IF EXISTS public.insert_notification(text, text, text, text);

-- Step 2: Create the new function with the corrected parameter `p_target_branch_id`.
CREATE OR REPLACE FUNCTION public.insert_notification(
    p_title text,
    p_message text,
    p_sender_name text,
    p_target_branch_id text -- Changed from p_target_branch_name to use the ID
)
RETURNS "public"."notifications" -- The table name is in quotes
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who defined it
AS $$
DECLARE
    new_notification "public"."notifications";
BEGIN
    INSERT INTO "public"."notifications" (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING * INTO new_notification;
    
    RETURN new_notification;
END;
$$;

-- Grant execution rights to authenticated users.
GRANT EXECUTE ON FUNCTION public.insert_notification(text, text, text, text) TO authenticated;

-- Notify the system that the function has been updated.
NOTIFY pgrst, 'reload schema';
