import { BulkMeter } from './bulk-meter-types'; // Assuming you have a types file for BulkMeter
import { supabase } from '@/lib/supabase';

export const createBulkMeter = (bulkMeter: Omit<BulkMeter, 'id'>): BulkMeter => {
  if (!bulkMeter.meterId || !bulkMeter.location) {
    throw new Error('Meter ID and location are required to create a bulk meter.');
  }

  const { data, error } = await supabase
 .from('bulk_meters')
 .insert([bulkMeter])
 .select()
 .single();
  if (error) {
 throw error;
  }
  return data;
};

export const getBulkMeterById = async (id: number): Promise<BulkMeter | undefined> => {
  const { data, error } = await supabase
 .from('bulk_meters')
 .select('*')
 .eq('id', id)
 .single();
  if (error) {
 console.error('Error fetching bulk meter by ID:', error);
 return undefined;
  }
  return data as BulkMeter;
};

export const getAllBulkMeters = async (): Promise<BulkMeter[]> => {
  const { data, error } = await supabase.from('bulk_meters').select('*');
  if (error) {
 throw error;
  }
  return data as BulkMeter[];
};

export const updateBulkMeter = async (id: number, updatedData: Partial<BulkMeter>): Promise<BulkMeter | undefined> => {
  const { data, error } = await supabase.from('bulk_meters').update(updatedData).eq('id', id).select().single();
  if (error) {
 throw error;
  }
  return data as BulkMeter;
};

export const deleteBulkMeter = async (id: number): Promise<boolean> => {
  const { error } = await supabase.from('bulk_meters').delete().eq('id', id);
  return !error; // True if deletion was successful (no error)
};