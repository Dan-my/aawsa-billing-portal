

export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';

export interface StaffMember {
  id: string;
  name: string;
  email: string; // This will be the login identifier, e.g., kality@aawsa.com
  password?: string; // Password for the staff member
  branch: string; // Branch name, e.g., "Kality Branch"
  status: StaffStatus;
  phone?: string; // Optional
  hireDate?: string; // Optional, ISO date string
}

