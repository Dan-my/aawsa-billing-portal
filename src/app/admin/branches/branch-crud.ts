import { supabase } from '@/lib/supabase';

interface Branch {
  id: string;
  name: string;
  location: string;
}

export async function createBranch(branch: Branch): Promise<Branch | null> {
  if (!branch.id || !branch.name || !branch.location) {
    throw new Error("Branch data is incomplete.");
  }
  const { data, error } = await supabase
    .from('branches')
    .insert([branch])
    .select();

  if (error) {
    throw error;
  }
  return data ? data[0] : null;
}

export async function getAllBranches(): Promise<Branch[] | null> {
  const { data, error } = await supabase
    .from('branches')
    .select('*');

  if (error) {
    throw error;
  }
  return data;
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateBranch(id: string, updatedBranch: Partial<Branch>): Promise<Branch | null> {
  const { data, error } = await supabase
    .from('branches')
    .update(updatedBranch)
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }
  return data ? data[0] : null;
}

export async function deleteBranch(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
  return true; // Assuming success if no error
}