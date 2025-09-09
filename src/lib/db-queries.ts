

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
export const dbGetAllBranches = async () => supabase.from('branches').select('*');
export const dbCreateBranch = async (branch: any) => supabase.from('branches').insert(branch).select().single();
export const dbUpdateBranch = async (id: string, branch: any) => supabase.from('branches').update(branch).eq('id', id).select().single();
export const dbDeleteBranch = async (id: string) => supabase.from('branches').delete().eq('id', id);

export const dbGetAllCustomers = async () => supabase.from('individual_customers').select('*');
export const dbCreateCustomer = async (customer: any) => supabase.from('individual_customers').insert(customer).select().single();
export const dbUpdateCustomer = async (customerKeyNumber: string, customer: any) => supabase.from('individual_customers').update(customer).eq('customerKeyNumber', customerKeyNumber).select().single();
export const dbDeleteCustomer = async (customerKeyNumber: string) => supabase.from('individual_customers').delete().eq('customerKeyNumber', customerKeyNumber);

export const dbGetAllBulkMeters = async () => supabase.from('bulk_meters').select('*');
export const dbCreateBulkMeter = async (bulkMeter: any) => supabase.from('bulk_meters').insert(bulkMeter).select().single();
export const dbUpdateBulkMeter = async (customerKeyNumber: string, bulkMeter: any) => supabase.from('bulk_meters').update(bulkMeter).eq('customerKeyNumber', customerKeyNumber).select().single();
export const dbDeleteBulkMeter = async (customerKeyNumber: string) => supabase.from('bulk_meters').delete().eq('customerKeyNumber', customerKeyNumber);

export const dbGetAllStaffMembers = async () => supabase.from('staff_members').select('*');
export const dbCreateStaffMember = async (staffMember: any) => supabase.from('staff_members').insert(staffMember).select().single();
export const dbUpdateStaffMember = async (email: string, staffMember: any) => supabase.from('staff_members').update(staffMember).eq('email', email).select().single();
export const dbDeleteStaffMember = async (email: string) => supabase.from('staff_members').delete().eq('email', email);

export const dbGetAllBills = async () => supabase.from('bills').select('*');
export const dbCreateBill = async (bill: any) => supabase.from('bills').insert(bill).select().single();
export const dbUpdateBill = async (id: string, bill: any) => supabase.from('bills').update(bill).eq('id', id).select().single();
export const dbDeleteBill = async (id: string) => supabase.from('bills').delete().eq('id', id);

export const dbGetAllIndividualCustomerReadings = async () => supabase.from('individual_customer_readings').select('*');
export const dbCreateIndividualCustomerReading = async (reading: any) => supabase.from('individual_customer_readings').insert(reading).select().single();
export const dbUpdateIndividualCustomerReading = async (id: string, reading: any) => supabase.from('individual_customer_readings').update(reading).eq('id', id).select().single();
export const dbDeleteIndividualCustomerReading = async (id: string) => supabase.from('individual_customer_readings').delete().eq('id', id);

export const dbGetAllBulkMeterReadings = async () => supabase.from('bulk_meter_readings').select('*');
export const dbCreateBulkMeterReading = async (reading: any) => supabase.from('bulk_meter_readings').insert(reading).select().single();
export const dbUpdateBulkMeterReading = async (id: string, reading: any) => supabase.from('bulk_meter_readings').update(reading).eq('id', id).select().single();
export const dbDeleteBulkMeterReading = async (id: string) => supabase.from('bulk_meter_readings').delete().eq('id', id);

export const dbGetAllPayments = async () => supabase.from('payments').select('*');
export const dbCreatePayment = async (payment: any) => supabase.from('payments').insert(payment).select().single();
export const dbUpdatePayment = async (id: string, payment: any) => supabase.from('payments').update(payment).eq('id', id).select().single();
export const dbDeletePayment = async (id: string) => supabase.from('payments').delete().eq('id', id);

export const dbGetAllReportLogs = async () => supabase.from('reports').select('*');
export const dbCreateReportLog = async (log: any) => supabase.from('reports').insert(log).select().single();
export const dbUpdateReportLog = async (id: string, log: any) => supabase.from('reports').update(log).eq('id', id).select().single();
export const dbDeleteReportLog = async (id: string) => supabase.from('reports').delete().eq('id', id);

export const dbGetAllNotifications = async () => supabase.from('notifications').select('*');
export const dbCreateNotification = async (notification: any) => supabase.rpc('insert_notification', notification).select().single();

export const dbGetAllRoles = async () => supabase.from('roles').select('*');
export const dbGetAllPermissions = async () => supabase.from('permissions').select('*');
export const dbGetAllRolePermissions = async () => supabase.from('role_permissions').select('*');
export const dbRpcUpdateRolePermissions = async (roleId: number, permissionIds: number[]) => supabase.rpc('update_role_permissions', { p_role_id: roleId, p_permission_ids: permissionIds });

export const dbGetAllTariffs = async () => supabase.from('tariffs').select('*');
export const dbCreateTariff = async (tariff: any) => supabase.from('tariffs').insert(tariff).select().single();
export const dbUpdateTariff = async (customerType: string, year: number, tariff: any) => {
    const { data, error } = await supabase
        .from('tariffs')
        .update(tariff)
        .eq('customer_type', customerType)
        .eq('year', year)
        .select()
        .single();
    
    return { data, error };
};

export const dbGetAllKnowledgeBaseArticles = async () => supabase.from('knowledge_base_articles').select('*');
export const dbCreateKnowledgeBaseArticle = async (article: any) => supabase.from('knowledge_base_articles').insert(article).select().single();
export const dbUpdateKnowledgeBaseArticle = async (id: number, article: any) => supabase.from('knowledge_base_articles').update(article).eq('id', id).select().single();
export const dbDeleteKnowledgeBaseArticle = async (id: number) => supabase.from('knowledge_base_articles').delete().eq('id', id);
