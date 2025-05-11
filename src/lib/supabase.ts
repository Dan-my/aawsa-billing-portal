import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getBranches() {
  const { data, error } = await supabase
    .from('branches')
    .select('*');

 return { data, error };
}

// --- CRUD Operations for Branches ---

// Create a new branch
export async function createBranch(branchData: {
  name: string;
  location?: string;
}) {
  const { data, error } = await supabase
    .from('branches')
    .insert([branchData]);

  if (error) {
    console.error('Error creating branch:', error.message);
  }
  return { data, error };
}

// --- CRUD Operations for Individual Customers ---

// Create a new individual customer
export async function createCustomer(customerData: {
  customer_key_number: string;
  bulk_meter_id?: string; // Optional if not linked initially
  name: string;
  contract_number: string;
  meter_number: string;
  location?: string;
  status?: string;
}) {
  const { data, error } = await supabase
 .from('individual_customers')
 .insert([customerData]);

  if (error) {
 console.error('Error creating customer:', error.message);
 return null;
  } else {
 console.log('Customer created successfully:', data);
 return data;
  }
}

// Read all individual customers
export async function getAllCustomers() {
  const { data, error } = await supabase
 .from('individual_customers')
 .select('*');

  if (error) {
 console.error('Error fetching customers:', error.message);
 return null;
  } else {
 console.log('All customers:', data);
 return data;
  }
}

// Read a single individual customer by customer key number
export async function getCustomerByKetNumber(customerKeyNumber: string) {
  const { data, error } = await supabase
 .from('individual_customers')
 .select('*')
 .eq('customer_key_number', customerKeyNumber)
 .single(); // Use single() to get a single record

  if (error) {
 console.error(`Error fetching customer with key number ${customerKeyNumber}:`, error.message);
 return null;
  } else {
 console.log(`Customer with key number ${customerKeyNumber}:`, data);
 return data;
  }
}

// Update an individual customer by customer key number
export async function updateCustomer(
  customerKeyNumber: string,
  updatedCustomerData: {
    bulk_meter_id?: string;
    name?: string;
    contract_number?: string;
    meter_number?: string;
    location?: string;
    status?: string;
  }
) {
  const { data, error } = await supabase
 .from('individual_customers')
 .update(updatedCustomerData)
 .eq('customer_key_number', customerKeyNumber);

  if (error) {
 console.error(`Error updating customer with key number ${customerKeyNumber}:`, error.message);
 return null;
  } else {
 console.log(`Customer with key number ${customerKeyNumber} updated successfully:`, data);
 return data;
  }
}

// Delete an individual customer by customer key number
export async function deleteCustomer(customerKeyNumber: string) {
  const { data, error } = await supabase
 .from('individual_customers')
 .delete()
 .eq('customer_key_number', customerKeyNumber);

  if (error) {
 console.error(`Error deleting customer with key number ${customerKeyNumber}:`, error.message);
 return null;
  } else {
 console.log(`Customer with key number ${customerKeyNumber} deleted successfully:`, data);
 return data;
  }
}