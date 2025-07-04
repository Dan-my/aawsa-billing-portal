

export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';

export interface StaffMember {
  id: string;
  name: string;
  email: string; // This will be the login identifier, e.g., kality@aawsa.com
  password?: string; // Password for the staff member
  role: 'Admin' | 'Staff';
  branch: string; // The name of the branch, e.g., "Kality Branch"
  status: StaffStatus;
  phone?: string; // Optional
  hireDate?: string; // Optional, ISO date string
}
