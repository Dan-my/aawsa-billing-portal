-- This script grants the 'Staff Management' role the necessary permission
-- to approve or reject new customer registrations.

-- It is safe to run this script multiple times. If the permission is already
-- granted, it will not be added again.

-- Step 1: Find the ID for the 'Staff Management' role.
WITH staff_management_role AS (
  SELECT id FROM public.roles WHERE role_name = 'Staff Management'
),
-- Step 2: Find the ID for the 'customers_approve' permission.
customers_approve_permission AS (
  SELECT id FROM public.permissions WHERE name = 'customers_approve'
)
-- Step 3: Insert the permission for the role, but only if it doesn't already exist.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM staff_management_role),
  (SELECT id FROM customers_approve_permission)
WHERE
  -- This condition prevents creating a duplicate entry.
  NOT EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE
      role_id = (SELECT id FROM staff_management_role) AND
      permission_id = (SELECT id FROM customers_approve_permission)
  );

-- Just in case, this also grants them permission to view their branch dashboard.
-- This might already exist, but we ensure it's there.
WITH staff_management_role AS (
  SELECT id FROM public.roles WHERE role_name = 'Staff Management'
),
dashboard_view_branch_permission AS (
  SELECT id FROM public.permissions WHERE name = 'dashboard_view_branch'
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM staff_management_role),
  (SELECT id FROM dashboard_view_branch_permission)
WHERE
  NOT EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE
      role_id = (SELECT id FROM staff_management_role) AND
      permission_id = (SELECT id FROM dashboard_view_branch_permission)
  );