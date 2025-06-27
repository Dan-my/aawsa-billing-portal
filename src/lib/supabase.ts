
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database as ActualDatabase } from '@/types/supabase';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          location: string;
          contactPerson?: string | null;
          contactPhone?: number | null;
          status: 'Active' | 'Inactive';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          contactPerson?: string | null;
          contactPhone?: number | null;
          status: 'Active' | 'Inactive';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          contactPerson?: string | null;
          contactPhone?: number | null;
          status?: 'Active' | 'Inactive';
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bulk_meters: {
        Row: {
          id: string;
          name: string;
          customerKeyNumber: string;
          contractNumber: string;
          meterSize: number;
          meterNumber: string;
          previousReading: number;
          currentReading: number;
          month: string;
          specificArea: string;
          location: string; 
          ward: string;
          status: 'Active' | 'Maintenance' | 'Decommissioned';
          paymentStatus: 'Paid' | 'Unpaid';
          branch_id?: string | null; 
          bulk_usage?: number | null;
          total_bulk_bill?: number | null;
          difference_usage?: number | null;
          difference_bill?: number | null;
          outStandingbill?: number | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          customerKeyNumber: string;
          contractNumber: string;
          meterSize: number;
          meterNumber: string;
          previousReading: number;
          currentReading: number;
          month: string;
          specificArea: string;
          location: string;
          ward: string;
          status: 'Active' | 'Maintenance' | 'Decommissioned';
          paymentStatus: 'Paid' | 'Unpaid';
          branch_id?: string | null; 
          bulk_usage?: number | null;
          total_bulk_bill?: number | null;
          difference_usage?: number | null;
          difference_bill?: number | null;
          outStandingbill?: number | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          customerKeyNumber?: string;
          contractNumber?: string;
          meterSize?: number;
          meterNumber?: string;
          previousReading?: number;
          currentReading?: number;
          month?: string;
          specificArea?: string;
          location?: string;
          ward?: string;
          status?: 'Active' | 'Maintenance' | 'Decommissioned';
          paymentStatus?: 'Paid' | 'Unpaid';
          branch_id?: string | null; 
          bulk_usage?: number | null;
          total_bulk_bill?: number | null;
          difference_usage?: number | null;
          difference_bill?: number | null;
          outStandingbill?: number | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        };
      };
      individual_customers: {
        Row: {
          id: string;
          name: string;
          customerKeyNumber: string;
          contractNumber: string;
          customerType: 'Domestic' | 'Non-domestic';
          bookNumber: string;
          ordinal: number;
          meterSize: number;
          meterNumber: string;
          previousReading: number;
          currentReading: number;
          month: string; 
          specificArea: string;
          location: string; 
          ward: string;
          sewerageConnection: 'Yes' | 'No';
          assignedBulkMeterId?: string | null;
          status: 'Active' | 'Inactive' | 'Suspended';
          paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
          calculatedBill: number;
          
          branch_id?: string | null; 
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          customerKeyNumber: string;
          contractNumber: string;
          customerType: 'Domestic' | 'Non-domestic';
          bookNumber: string;
          ordinal: number;
          meterSize: number;
          meterNumber: string;
          previousReading: number;
          currentReading: number;
          month: string; 
          specificArea: string;
          location: string;
          ward: string;
          sewerageConnection: 'Yes' | 'No';
          assignedBulkMeterId?: string | null;
          status?: 'Active' | 'Inactive' | 'Suspended';
          paymentStatus?: 'Paid' | 'Unpaid' | 'Pending';
          calculatedBill?: number;
          
          branch_id?: string | null; 
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          customerKeyNumber?: string;
          contractNumber?: string;
          customerType?: 'Domestic' | 'Non-domestic';
          bookNumber?: string;
          ordinal?: number;
          meterSize?: number;
          meterNumber?: string;
          previousReading?: number;
          currentReading?: number;
          month?: string; 
          specificArea?: string;
          location?: string;
          ward?: string;
          sewerageConnection?: 'Yes' | 'No';
          assignedBulkMeterId?: string | null;
          status?: 'Active' | 'Inactive' | 'Suspended';
          paymentStatus?: 'Paid' | 'Unpaid' | 'Pending';
          calculatedBill?: number;
          
          branch_id?: string | null; 
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      staff_members: {
        Row: {
          id: string;
          name: string;
          email: string;
          password?: string;
          branch: string;
          status: 'Active' | 'Inactive' | 'On Leave';
          phone?: string | null;
          hire_date?: string | null;
          role: 'Admin' | 'Staff';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password?: string;
          branch: string;
          status: 'Active' | 'Inactive' | 'On Leave';
          phone?: string | null;
          hire_date?: string | null;
          role: 'Admin' | 'Staff';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          branch?: string;
          status?: 'Active' | 'Inactive' | 'On Leave';
          phone?: string | null;
          hire_date?: string | null;
          role?: 'Admin' | 'Staff';
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bills: {
        Row: {
          id: string;
          individual_customer_id?: string | null;
          bulk_meter_id?: string | null;
          bill_period_start_date: string;
          bill_period_end_date: string;
          month_year: string;
          previous_reading_value: number;
          current_reading_value: number;
          usage_m3?: number | null;
          base_water_charge: number;
          sewerage_charge?: number | null;
          maintenance_fee?: number | null;
          sanitation_fee?: number | null;
          meter_rent?: number | null;
          balance_carried_forward?: number | null;
          total_amount_due: number;
          amount_paid?: number;
          balance_due?: number | null;
          due_date: string;
          payment_status: 'Paid' | 'Unpaid';
          bill_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          individual_customer_id?: string | null;
          bulk_meter_id?: string | null;
          bill_period_start_date: string;
          bill_period_end_date: string;
          month_year: string;
          previous_reading_value: number;
          current_reading_value: number;
          base_water_charge: number;
          sewerage_charge?: number | null;
          maintenance_fee?: number | null;
          sanitation_fee?: number | null;
          meter_rent?: number | null;
          balance_carried_forward?: number | null;
          total_amount_due: number;
          amount_paid?: number;
          due_date: string;
          payment_status?: 'Paid' | 'Unpaid';
          bill_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          individual_customer_id?: string | null;
          bulk_meter_id?: string | null;
          bill_period_start_date?: string;
          bill_period_end_date?: string;
          month_year?: string;
          previous_reading_value?: number;
          current_reading_value?: number;
          base_water_charge?: number;
          sewerage_charge?: number | null;
          maintenance_fee?: number | null;
          sanitation_fee?: number | null;
          meter_rent?: number | null;
          balance_carried_forward?: number | null;
          total_amount_due?: number;
          amount_paid?: number;
          due_date?: string;
          payment_status?: 'Paid' | 'Unpaid';
          bill_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      individual_customer_readings: {
        Row: {
          id: string;
          individual_customer_id: string;
          reader_staff_id?: string | null;
          reading_date: string;
          month_year: string;
          reading_value: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          individual_customer_id: string;
          reader_staff_id?: string | null;
          reading_date?: string;
          month_year: string;
          reading_value: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          individual_customer_id?: string;
          reader_staff_id?: string | null;
          reading_date?: string;
          month_year?: string;
          reading_value?: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bulk_meter_readings: {
        Row: {
          id: string;
          bulk_meter_id: string;
          reader_staff_id?: string | null;
          reading_date: string;
          month_year: string;
          reading_value: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          bulk_meter_id: string;
          reader_staff_id?: string | null;
          reading_date?: string;
          month_year: string;
          reading_value: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          bulk_meter_id?: string;
          reader_staff_id?: string | null;
          reading_date?: string;
          month_year?: string;
          reading_value?: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          bill_id?: string | null;
          individual_customer_id?: string | null;
          payment_date: string;
          amount_paid: number;
          payment_method: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
          transaction_reference?: string | null;
          processed_by_staff_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          bill_id?: string | null;
          individual_customer_id?: string | null;
          payment_date?: string;
          amount_paid: number;
          payment_method: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
          transaction_reference?: string | null;
          processed_by_staff_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          bill_id?: string | null;
          individual_customer_id?: string | null;
          payment_date?: string;
          amount_paid?: number;
          payment_method?: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
          transaction_reference?: string | null;
          processed_by_staff_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          report_name: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
          description?: string | null;
          generated_at: string;
          generated_by_staff_id?: string | null;
          parameters?: Json | null;
          file_format?: string | null;
          file_name?: string | null;
          status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          report_name: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
          description?: string | null;
          generated_at?: string;
          generated_by_staff_id?: string | null;
          parameters?: Json | null;
          file_format?: string | null;
          file_name?: string | null;
          status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          report_name?: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
          description?: string | null;
          generated_at?: string;
          generated_by_staff_id?: string | null;
          parameters?: Json | null;
          file_format?: string | null;
          file_name?: string | null;
          status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      [key: string]: never;
    };
    Enums: {
        branch_status_enum: 'Active' | 'Inactive';
        bulk_meter_status_enum: 'Active' | 'Maintenance' | 'Decommissioned';
        payment_status_enum: 'Paid' | 'Unpaid' | 'Pending';
        customer_type_enum: 'Domestic' | 'Non-domestic';
        sewerage_connection_enum: 'Yes' | 'No';
        individual_customer_status_enum: 'Active' | 'Inactive' | 'Suspended';
        staff_status_enum: 'Active' | 'Inactive' | 'On Leave';
        payment_method_enum: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
        report_type_enum: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
        report_status_enum: 'Generated' | 'Pending' | 'Failed' | 'Archived';
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
}

type ResolvedDatabase = ActualDatabase extends { public: any } ? ActualDatabase : Database;

export type Branch = ResolvedDatabase['public']['Tables']['branches']['Row'];
export type BranchInsert = ResolvedDatabase['public']['Tables']['branches']['Insert'];
export type BranchUpdate = ResolvedDatabase['public']['Tables']['branches']['Update'];

export type BulkMeterRow = ResolvedDatabase['public']['Tables']['bulk_meters']['Row'];
export type BulkMeterInsert = ResolvedDatabase['public']['Tables']['bulk_meters']['Insert'];
export type BulkMeterUpdate = ResolvedDatabase['public']['Tables']['bulk_meters']['Update'];

export type IndividualCustomer = ResolvedDatabase['public']['Tables']['individual_customers']['Row'];
export type IndividualCustomerInsert = ResolvedDatabase['public']['Tables']['individual_customers']['Insert'];
export type IndividualCustomerUpdate = ResolvedDatabase['public']['Tables']['individual_customers']['Update'];

export type StaffMember = ResolvedDatabase['public']['Tables']['staff_members']['Row'];
export type StaffMemberInsert = ResolvedDatabase['public']['Tables']['staff_members']['Insert'];
export type StaffMemberUpdate = ResolvedDatabase['public']['Tables']['staff_members']['Update'];

export type Bill = ResolvedDatabase['public']['Tables']['bills']['Row'];
export type BillInsert = ResolvedDatabase['public']['Tables']['bills']['Insert'];
export type BillUpdate = ResolvedDatabase['public']['Tables']['bills']['Update'];

export type IndividualCustomerReading = ResolvedDatabase['public']['Tables']['individual_customer_readings']['Row'];
export type IndividualCustomerReadingInsert = ResolvedDatabase['public']['Tables']['individual_customer_readings']['Insert'];
export type IndividualCustomerReadingUpdate = ResolvedDatabase['public']['Tables']['individual_customer_readings']['Update'];

export type BulkMeterReading = ResolvedDatabase['public']['Tables']['bulk_meter_readings']['Row'];
export type BulkMeterReadingInsert = ResolvedDatabase['public']['Tables']['bulk_meter_readings']['Insert'];
export type BulkMeterReadingUpdate = ResolvedDatabase['public']['Tables']['bulk_meter_readings']['Update'];

export type Payment = ResolvedDatabase['public']['Tables']['payments']['Row'];
export type PaymentInsert = ResolvedDatabase['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = ResolvedDatabase['public']['Tables']['payments']['Update'];

export type ReportLog = ResolvedDatabase['public']['Tables']['reports']['Row'];
export type ReportLogInsert = ResolvedDatabase['public']['Tables']['reports']['Insert'];
export type ReportLogUpdate = ResolvedDatabase['public']['Tables']['reports']['Update'];


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined in environment variables. Please set NEXT_PUBLIC_SUPABASE_URL.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined in environment variables. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase: SupabaseClient<ResolvedDatabase> = createClient<ResolvedDatabase>(supabaseUrl, supabaseAnonKey);

// CRUD for Branches
export const getAllBranches = async () => supabase.from('branches').select('*');
export const createBranch = async (branch: BranchInsert) => supabase.from('branches').insert(branch).select().single();
export const updateBranch = async (id: string, branch: BranchUpdate) => supabase.from('branches').update(branch).eq('id', id).select().single();
export const deleteBranch = async (id: string) => supabase.from('branches').delete().eq('id', id).select().single();

// CRUD for Bulk Meters
export const getAllBulkMeters = async () => supabase.from('bulk_meters').select('*');
export const createBulkMeter = async (bulkMeter: BulkMeterInsert) => supabase.from('bulk_meters').insert(bulkMeter).select().single();
export const updateBulkMeter = async (id: string, bulkMeter: BulkMeterUpdate) => supabase.from('bulk_meters').update(bulkMeter).eq('id', id).select().single();
export const deleteBulkMeter = async (id: string) => supabase.from('bulk_meters').delete().eq('id', id).select().single();

// CRUD for Individual Customers
export const getAllCustomers = async () => supabase.from('individual_customers').select('*');
export const createCustomer = async (customer: IndividualCustomerInsert) => supabase.from('individual_customers').insert(customer).select().single();
export const updateCustomer = async (id: string, customer: IndividualCustomerUpdate) => supabase.from('individual_customers').update(customer).eq('id', id).select().single();
export const deleteCustomer = async (id: string) => supabase.from('individual_customers').delete().eq('id', id).select().single();

// CRUD for Staff Members
export const getAllStaffMembers = async () => supabase.from('staff_members').select('*');
export const createStaffMember = async (staffMember: StaffMemberInsert) => supabase.from('staff_members').insert(staffMember).select().single();
export const updateStaffMember = async (id: string, staffMember: StaffMemberUpdate) => supabase.from('staff_members').update(staffMember).eq('id', id).select().single();
export const deleteStaffMember = async (id: string) => supabase.from('staff_members').delete().eq('id', id).select().single();

// CRUD for Bills
export const getAllBills = async () => supabase.from('bills').select('*');
export const createBill = async (bill: BillInsert) => supabase.from('bills').insert(bill).select().single();
export const updateBill = async (id: string, bill: BillUpdate) => supabase.from('bills').update(bill).eq('id', id).select().single();
export const deleteBill = async (id: string) => supabase.from('bills').delete().eq('id', id).select().single();

// CRUD for Individual Customer Readings
export const getAllIndividualCustomerReadings = async () => supabase.from('individual_customer_readings').select('*');
export const createIndividualCustomerReading = async (reading: IndividualCustomerReadingInsert) => supabase.from('individual_customer_readings').insert(reading).select().single();
export const updateIndividualCustomerReading = async (id: string, reading: IndividualCustomerReadingUpdate) => supabase.from('individual_customer_readings').update(reading).eq('id', id).select().single();
export const deleteIndividualCustomerReading = async (id: string) => supabase.from('individual_customer_readings').delete().eq('id', id).select().single();

// CRUD for Bulk Meter Readings
export const getAllBulkMeterReadings = async () => supabase.from('bulk_meter_readings').select('*');
export const createBulkMeterReading = async (reading: BulkMeterReadingInsert) => supabase.from('bulk_meter_readings').insert(reading).select().single();
export const updateBulkMeterReading = async (id: string, reading: BulkMeterReadingUpdate) => supabase.from('bulk_meter_readings').update(reading).eq('id', id).select().single();
export const deleteBulkMeterReading = async (id: string) => supabase.from('bulk_meter_readings').delete().eq('id', id).select().single();

// CRUD for Payments
export const getAllPayments = async () => supabase.from('payments').select('*');
export const createPayment = async (payment: PaymentInsert) => supabase.from('payments').insert(payment).select().single();
export const updatePayment = async (id: string, payment: PaymentUpdate) => supabase.from('payments').update(payment).eq('id', id).select().single();
export const deletePayment = async (id: string) => supabase.from('payments').delete().eq('id', id).select().single();

// CRUD for Report Logs (Table: 'reports')
export const getAllReportLogs = async () => supabase.from('reports').select('*');
export const createReportLog = async (reportLog: ReportLogInsert) => supabase.from('reports').insert(reportLog).select().single();
export const updateReportLog = async (id: string, reportLog: ReportLogUpdate) => supabase.from('reports').update(reportLog).eq('id', id).select().single();
export const deleteReportLog = async (id: string) => supabase.from('reports').delete().eq('id', id).select().single();
