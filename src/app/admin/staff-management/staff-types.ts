

export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';

export interface StaffMember {
  id: string;
  name: string;
  email: string; // This will be the login identifier, e.g., kality@aawsa.com
  password?: string; // Password for the staff member
  role: 'Admin' | 'Staff';
  branchId: string; // The ID of the branch
  branchName: string; // The name of the branch for display
  status: StaffStatus;
  phone?: string; // Optional
  hireDate?: string; // Optional, ISO date string
}
