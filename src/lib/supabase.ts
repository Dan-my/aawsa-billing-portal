
import { createClient } from '@supabase/supabase-js';
import type { Branch, BranchStatus } from '@/app/admin/branches/branch-types';
import type { IndividualCustomer, CustomerType, SewerageConnection, PaymentStatus, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter, BulkMeterStatus } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { StaffMember, StaffStatus } from '@/app/admin/staff-management/staff-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// --- CRUD Operations for Branches ---
export async function getAllBranches() {
  const { data, error } = await supabase
    .from('branches')
    .select('*');
  if (error) console.error('Error fetching branches:', error.message);
  return { data: data as Branch[] | null, error };
}

export async function getBranchById(id: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();
  if (error) console.error('Error fetching branch by ID:', error.message);
  return { data: data as Branch | null, error };
}

export async function createBranch(branchData: Omit<Branch, 'id'>) {
  const { data, error } = await supabase
    .from('branches')
    .insert([branchData])
    .select()
    .single();
  if (error) console.error('Error creating branch:', error.message);
  return { data: data as Branch | null, error };
}

export async function updateBranch(id: string, branchData: Partial<Omit<Branch, 'id'>>) {
  const { data, error } = await supabase
    .from('branches')
    .update(branchData)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating branch:', error.message);
  return { data: data as Branch | null, error };
}

export async function deleteBranch(id: string) {
  const { data, error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)
    .select()
    .single(); 
  if (error) console.error('Error deleting branch:', error.message);
  return { data: data as Branch | null, error };
}

// --- CRUD Operations for Individual Customers ---
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from('individual_customers')
    .select('*');
  if (error) console.error('Error fetching customers:', error.message);
  return { data: data as IndividualCustomer[] | null, error };
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from('individual_customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) console.error('Error fetching customer by ID:', error.message);
  return { data: data as IndividualCustomer | null, error };
}

export async function createCustomer(customerData: Omit<IndividualCustomer, 'id'>) {
  const { data, error } = await supabase
    .from('individual_customers')
    .insert([customerData])
    .select()
    .single();
  if (error) console.error('Error creating customer:', error.message);
  return { data: data as IndividualCustomer | null, error };
}

export async function updateCustomer(id: string, customerData: Partial<Omit<IndividualCustomer, 'id'>>) {
  const { data, error } = await supabase
    .from('individual_customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating customer:', error.message);
  return { data: data as IndividualCustomer | null, error };
}

export async function deleteCustomer(id: string) {
  const { data, error } = await supabase
    .from('individual_customers')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error deleting customer:', error.message);
  return { data: data as IndividualCustomer | null, error };
}

// --- CRUD Operations for Bulk Meters ---
export async function getAllBulkMeters() {
  const { data, error } = await supabase
    .from('bulk_meters')
    .select('*');
  if (error) console.error('Error fetching bulk meters:', error.message);
  return { data: data as BulkMeter[] | null, error };
}

export async function getBulkMeterById(id: string) {
  const { data, error } = await supabase
    .from('bulk_meters')
    .select('*')
    .eq('id', id)
    .single();
  if (error) console.error('Error fetching bulk meter by ID:', error.message);
  return { data: data as BulkMeter | null, error };
}

export async function createBulkMeter(bulkMeterData: Omit<BulkMeter, 'id'>) {
  const { data, error } = await supabase
    .from('bulk_meters')
    .insert([bulkMeterData])
    .select()
    .single();
  if (error) console.error('Error creating bulk meter:', error.message);
  return { data: data as BulkMeter | null, error };
}

export async function updateBulkMeter(id: string, bulkMeterData: Partial<Omit<BulkMeter, 'id'>>) {
  const { data, error } = await supabase
    .from('bulk_meters')
    .update(bulkMeterData)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating bulk meter:', error.message);
  return { data: data as BulkMeter | null, error };
}

export async function deleteBulkMeter(id: string) {
  const { data, error } = await supabase
    .from('bulk_meters')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error deleting bulk meter:', error.message);
  return { data: data as BulkMeter | null, error };
}

// --- CRUD Operations for Staff Members ---
// Assuming 'staff_members' table in Supabase
export async function getAllStaffMembers() {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*');
  if (error) console.error('Error fetching staff members:', error.message);
  // Ensure password is included if your logic relies on it client-side (e.g., AuthForm)
  // However, typically passwords shouldn't be sent to the client.
  // For this app's current structure, we might need it.
  return { data: data as StaffMember[] | null, error };
}

export async function getStaffMemberById(id: string) {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .eq('id', id)
    .single();
  if (error) console.error('Error fetching staff member by ID:', error.message);
  return { data: data as StaffMember | null, error };
}

// For createStaffMember, password handling is important.
// Supabase Auth handles hashing. If not using Supabase Auth for staff,
// you'd handle hashing server-side (e.g., in a Supabase Edge Function) or store as is (less secure).
// Current app structure seems to imply plain text password matching.
export async function createStaffMember(staffData: Omit<StaffMember, 'id'>) {
  const { data, error } = await supabase
    .from('staff_members')
    .insert([staffData]) // Ensure staffData has `password` if required by table
    .select()
    .single();
  if (error) console.error('Error creating staff member:', error.message);
  return { data: data as StaffMember | null, error };
}

export async function updateStaffMember(id: string, staffData: Partial<Omit<StaffMember, 'id'>>) {
  // If password is not part of staffData, it won't be updated.
  // If it is, it will be updated as plain text based on current app structure.
  const { data, error } = await supabase
    .from('staff_members')
    .update(staffData)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating staff member:', error.message);
  return { data: data as StaffMember | null, error };
}

export async function deleteStaffMember(id: string) {
  const { data, error } = await supabase
    .from('staff_members')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error deleting staff member:', error.message);
  return { data: data as StaffMember | null, error };
}
