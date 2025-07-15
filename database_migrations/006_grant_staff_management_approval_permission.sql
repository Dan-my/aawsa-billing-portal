-- This script grants the 'customers_approve' permission to the 'Staff Management' role.
-- It is designed to be safe to run multiple times.

-- Step 1: Ensure the 'customers_approve' permission exists in the permissions table.
-- If it doesn't exist, it will be inserted. If it does, this does nothing.
INSERT INTO public.permissions (name, description, category)
VALUES ('customers_approve', 'Can approve or reject new customer registrations.', 'Customers')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Grant the permission to the 'Staff Management' role.
-- This finds the id for the role and the permission and links them.
-- The ON CONFLICT clause prevents errors if the link already exists.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM public.roles WHERE role_name = 'Staff Management'),
  (SELECT id FROM public.permissions WHERE name = 'customers_approve')
ON CONFLICT (role_id, permission_id) DO NOTHING;
