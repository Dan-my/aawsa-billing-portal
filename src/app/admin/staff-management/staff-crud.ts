import { createClient } from '@supabase/supabase-js';

export interface Staff {
  id: string;
  name: string;
  role: string;
  branchId: string; // Assuming staff are linked to a branch
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const createStaff = async (staff: Omit<Staff, 'id'>): Promise<Staff> => {
  if (!staff.name || !staff.role || !staff.branchId) {
    throw new Error("Staff name, role, and branch ID are required.");
  }
  const { data, error } = await supabase.from('staff').insert([staff]).select().single();
  if (error) throw error;
  return data;
};

export const getAllStaff = async (): Promise<Staff[]> => {
  const { data, error } = await supabase.from('staff').select('*');
  if (error) throw error;
  return data;
};

export const getStaffById = async (id: string): Promise<Staff | undefined> => {
  const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
  if (error) throw error;
  return data || undefined;
};

export const updateStaff = async (id: string, updatedStaff: Partial<Omit<Staff, 'id'>>): Promise<Staff | undefined> => {
  const { data, error } = await supabase.from('staff').update(updatedStaff).eq('id', id).select().single();
  if (error) throw error;
  return data || undefined;
};

export const deleteStaff = (id: string): boolean => {
  const initialLength = staffData.length;
  staffData = staffData.filter(staff => staff.id !== id);
  return staffData.length < initialLength; // Return true if staff was deleted
};

// Optional: Function to clear all staff data (useful for testing)
export const clearAllStaff = async (): Promise<void> => {
  const { error } = await supabase.from('staff').delete().neq('id', '0'); // Delete all rows
  if (error) throw error;
};