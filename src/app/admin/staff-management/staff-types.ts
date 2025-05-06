
export type StaffRole = 'Manager' | 'Cashier' | 'Technician' | 'Support' | 'Data Entry Clerk' | 'Admin Assistant';
export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  branch: string; // For simplicity, branch is a string. Could be an ID linking to a branches collection.
  status: StaffStatus;
  phone?: string; // Optional
  hireDate?: string; // Optional, ISO date string
}
