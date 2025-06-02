import { supabase } from '@/lib/supabase';

interface IndividualCustomer {
  id: string;
  name: string;
  address: string;
  contact: string;
  meterId: string;
  created_at?: string; // Add created_at field for Supabase
}

export const createIndividualCustomer = async (customer: IndividualCustomer): Promise<IndividualCustomer | null> => {
  if (!customer.id || !customer.name || !customer.address || !customer.contact || !customer.meterId) {
    throw new Error("All fields are required for a new individual customer.");
  }

  const { data, error } = await supabase
    .from('individual_customers')
    .insert([customer])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const getAllIndividualCustomers = async (): Promise<IndividualCustomer[]> => {
  const { data, error } = await supabase
    .from('individual_customers')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const getIndividualCustomerById = async (id: string): Promise<IndividualCustomer | null> => {
  const { data, error } = await supabase
    .from('individual_customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const updateIndividualCustomer = async (id: string, updatedCustomer: Partial<IndividualCustomer>): Promise<IndividualCustomer | null> => {
  const { data, error } = await supabase
    .from('individual_customers')
    .update(updatedCustomer)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const deleteIndividualCustomer = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('individual_customers')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
  return !error; // Return true if no error occurred
};