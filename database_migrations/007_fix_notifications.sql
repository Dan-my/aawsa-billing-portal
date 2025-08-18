-- Drop the existing function to ensure a clean re-creation and resolve any overloading conflicts.
-- The IF EXISTS clause prevents an error if the function doesn't exist.
DROP FUNCTION IF EXISTS public.insert_notification(text, text, text, text);
DROP FUNCTION IF EXISTS public.insert_notification(text, text, text, uuid);


-- Re-create the function with the correct parameter types and return structure.
-- p_target_branch_id is explicitly defined as uuid.
-- The function now returns a single record matching the notifications table structure.
CREATE OR REPLACE FUNCTION public.insert_notification(
    p_title text,
    p_message text,
    p_sender_name text,
    p_target_branch_id uuid DEFAULT NULL -- Explicitly set to uuid
)
RETURNS SETOF notifications -- Ensure the return type matches the table
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial for allowing insertion while RLS is active
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.notifications (title, message, sender_name, target_branch_id)
    VALUES (p_title, p_message, p_sender_name, p_target_branch_id)
    RETURNING id, created_at, title, message, sender_name, target_branch_id; -- Explicitly return all columns
END;
$$;

-- Grant execution rights to the authenticated role.
-- This allows logged-in users to call this function.
GRANT EXECUTE ON FUNCTION public.insert_notification(text, text, text, uuid) TO authenticated;
