
import { createClient } from '@supabase/supabase-js';
import type { Branch, BranchStatus } from '@/app/admin/branches/branch-types';
import type { IndividualCustomer, CustomerType, SewerageConnection, PaymentStatus, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter, BulkMeterStatus } from '@/app/admin/bulk-meters/bulk-meter-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This will be caught by Next.js during build or server-side rendering if vars are missing
  // For client-side, it might result in Supabase client initialization errors
  console.error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

// Initialize Supabase client. If URL/Key are undefined, this will likely throw an error or fail silently.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// --- Helper to map camelCase to snake_case for Supabase ---
// Supabase JS client v2 often handles this automatically, but being explicit can avoid issues.
// For this refactor, we'll assume the client handles it, but if not, this function would be used.
/*
const toSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
};
*/

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
    .insert([branchData]) // Supabase client should handle camelCase to snake_case mapping
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
    .single(); // Returns the deleted record
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
