
// This file is intentionally left blank. 
// The data-store.ts file now directly handles database interactions.
// We are keeping this file to avoid breaking existing imports, but it no longer contains logic.
import { supabase } from './supabase';
import type { Database } from '@/types/supabase';


export const getStaffMemberForAuth = async (email: string, password?: string) => {
    // Note: In a real production app, password verification should be handled
    // by a proper auth system. This is a simplified check.
    const query = supabase
        .from('staff_members')
        .select(`
            *,
            roles ( role_name )
        `)
        .eq('email', email)
        .single();
    
    return query;
};

// Re-export other functions if needed by actions.ts
export const getAllBranches = async () => supabase.from('branches').select('*');
export const createBranch = async (branch: any) => supabase.from('branches').insert(branch).select().single();
export const updateBranch = async (id: string, branch: any) => supabase.from('branches').update(branch).eq('id', id).select().single();
export const deleteBranch = async (id: string) => supabase.from('branches').delete().eq('id', id);

export const getAllCustomers = async () => supabase.from('individual_customers').select('*');
export const createCustomer = async (customer: any) => supabase.from('individual_customers').insert(customer).select().single();
export const updateCustomer = async (customerKeyNumber: string, customer: any) => supabase.from('individual_customers').update(customer).eq('customerKeyNumber', customerKeyNumber).select().single();
export const deleteCustomer = async (customerKeyNumber: string) => supabase.from('individual_customers').delete().eq('customerKeyNumber', customerKeyNumber);

export const getAllBulkMeters = async () => supabase.from('bulk_meters').select('*');
export const createBulkMeter = async (bulkMeter: any) => supabase.from('bulk_meters').insert(bulkMeter).select().single();
export const updateBulkMeter = async (customerKeyNumber: string, bulkMeter: any) => supabase.from('bulk_meters').update(bulkMeter).eq('customerKeyNumber', customerKeyNumber).select().single();
export const deleteBulkMeter = async (customerKeyNumber: string) => supabase.from('bulk_meters').delete().eq('customerKeyNumber', customerKeyNumber);

export const getAllStaffMembers = async () => supabase.from('staff_members').select('*');
export const createStaffMember = async (staffMember: any) => supabase.from('staff_members').insert(staffMember).select().single();
export const updateStaffMember = async (email: string, staffMember: any) => supabase.from('staff_members').update(staffMember).eq('email', email).select().single();
export const deleteStaffMember = async (email: string) => supabase.from('staff_members').delete().eq('email', email);

export const getAllBills = async () => supabase.from('bills').select('*');
export const createBill = async (bill: any) => supabase.from('bills').insert(bill).select().single();
export const updateBill = async (id: string, bill: any) => supabase.from('bills').update(bill).eq('id', id).select().single();
export const deleteBill = async (id: string) => supabase.from('bills').delete().eq('id', id);

export const getAllIndividualCustomerReadings = async () => supabase.from('individual_customer_readings').select('*');
export const createIndividualCustomerReading = async (reading: any) => supabase.from('individual_customer_readings').insert(reading).select().single();
export const updateIndividualCustomerReading = async (id: string, reading: any) => supabase.from('individual_customer_readings').update(reading).eq('id', id).select().single();
export const deleteIndividualCustomerReading = async (id: string) => supabase.from('individual_customer_readings').delete().eq('id', id);

export const getAllBulkMeterReadings = async () => supabase.from('bulk_meter_readings').select('*');
export const createBulkMeterReading = async (reading: any) => supabase.from('bulk_meter_readings').insert(reading).select().single();
export const updateBulkMeterReading = async (id: string, reading: any) => supabase.from('bulk_meter_readings').update(reading).eq('id', id).select().single();
export const deleteBulkMeterReading = async (id: string) => supabase.from('bulk_meter_readings').delete().eq('id', id);

export const getAllPayments = async () => supabase.from('payments').select('*');
export const createPayment = async (payment: any) => supabase.from('payments').insert(payment).select().single();
export const updatePayment = async (id: string, payment: any) => supabase.from('payments').update(payment).eq('id', id).select().single();
export const deletePayment = async (id: string) => supabase.from('payments').delete().eq('id', id);

export const getAllReportLogs = async () => supabase.from('reports').select('*');
export const createReportLog = async (log: any) => supabase.from('reports').insert(log).select().single();
export const updateReportLog = async (id: string, log: any) => supabase.from('reports').update(log).eq('id', id).select().single();
export const deleteReportLog = async (id: string) => supabase.from('reports').delete().eq('id', id);

export const getAllNotifications = async () => supabase.from('notifications').select('*');
export const createNotification = async (notification: any) => supabase.rpc('insert_notification', notification).select().single();

export const getAllRoles = async () => supabase.from('roles').select('*');
export const getAllPermissions = async () => supabase.from('permissions').select('*');
export const getAllRolePermissions = async () => supabase.from('role_permissions').select('*');
export const rpcUpdateRolePermissions = async (roleId: number, permissionIds: number[]) => supabase.rpc('update_role_permissions', { p_role_id: roleId, p_permission_ids: permissionIds });

export const getAllTariffs = async () => supabase.from('tariffs').select('*');
export const createTariff = async (tariff: any) => supabase.from('tariffs').insert(tariff).select().single();
export const updateTariff = async (customerType: string, year: number, tariff: any) => supabase.from('tariffs').update(tariff).eq('customer_type', customerType).eq('year', year).select().single();
