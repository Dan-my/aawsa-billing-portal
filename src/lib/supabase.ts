
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT:
// 1. You MUST generate the actual Supabase types for your project.
//    Run this command in your terminal (replace YOUR_PROJECT_ID):
//    npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/supabase.ts
// 2. Once src/types/supabase.ts is generated, you can remove the placeholder Database type below.
// 3. Update the import path if your types file is located elsewhere.

// Attempt to import actual generated types
import type { Database as ActualDatabase } from '@/types/supabase';

// --- Placeholder Database Type (Remove after generating src/types/supabase.ts) ---
// This placeholder allows the code to compile if src/types/supabase.ts doesn't exist yet.
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
          contact_person?: string | null;
          contact_phone?: string | null;
          status: 'Active' | 'Inactive'; // Assuming branch_status_enum
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          contact_person?: string | null;
          contact_phone?: string | null;
          status: 'Active' | 'Inactive';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          contact_person?: string | null;
          contact_phone?: string | null;
          status?: 'Active' | 'Inactive';
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bulk_meters: { // Updated to camelCase based on user image
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
          createdAt?: string | null;
          updatedAt?: string | null;
        };
      };
      individual_customers: {
        Row: {
          id: string;
          name: string;
          customer_key_number: string;
          contract_number: string;
          customer_type: 'Domestic' | 'Non-domestic'; // Assuming customer_type_enum
          book_number: string;
          ordinal: number;
          meter_size: number;
          meter_number: string;
          previous_reading: number;
          current_reading: number;
          month: string;
          specific_area: string;
          location: string;
          ward: string;
          sewerage_connection: 'Yes' | 'No'; // Assuming sewerage_connection_enum
          assigned_bulk_meter_id?: string | null;
          status: 'Active' | 'Inactive' | 'Suspended'; // Assuming individual_customer_status_enum
          payment_status: 'Paid' | 'Unpaid'; // Assuming payment_status_enum
          calculated_bill: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          customer_key_number: string;
          contract_number: string;
          customer_type: 'Domestic' | 'Non-domestic';
          book_number: string;
          ordinal: number;
          meter_size: number;
          meter_number: string;
          previous_reading: number;
          current_reading: number;
          month: string;
          specific_area: string;
          location: string;
          ward: string;
          sewerage_connection: 'Yes' | 'No';
          assigned_bulk_meter_id?: string | null;
          status: 'Active' | 'Inactive' | 'Suspended';
          payment_status: 'Paid' | 'Unpaid';
          calculated_bill: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          customer_key_number?: string;
          contract_number?: string;
          customer_type?: 'Domestic' | 'Non-domestic';
          book_number?: string;
          ordinal?: number;
          meter_size?: number;
          meter_number?: string;
          previous_reading?: number;
          current_reading?: number;
          month?: string;
          specific_area?: string;
          location?: string;
          ward?: string;
          sewerage_connection?: 'Yes' | 'No';
          assigned_bulk_meter_id?: string | null;
          status?: 'Active' | 'Inactive' | 'Suspended';
          payment_status?: 'Paid' | 'Unpaid';
          calculated_bill?: number;
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
          status: 'Active' | 'Inactive' | 'On Leave'; // Assuming staff_status_enum
          phone?: string | null;
          hire_date?: string | null; // Assuming DATE stored as string
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
          bill_period_start_date: string; // Assuming DATE stored as string
          bill_period_end_date: string; // Assuming DATE stored as string
          month_year: string;
          previous_reading_value: number;
          current_reading_value: number;
          usage_m3?: number | null; // Generated column
          base_water_charge: number;
          sewerage_charge?: number | null;
          maintenance_fee?: number | null;
          sanitation_fee?: number | null;
          meter_rent?: number | null;
          total_amount_due: number;
          amount_paid?: number;
          balance_due?: number | null; // Generated column
          due_date: string; // Assuming DATE stored as string
          payment_status: 'Paid' | 'Unpaid'; // Assuming payment_status_enum
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
      meter_readings: {
        Row: {
          id: string;
          meter_type: 'individual_customer_meter' | 'bulk_meter'; // Assuming meter_reading_meter_type_enum
          individual_customer_id?: string | null;
          bulk_meter_id?: string | null;
          reader_staff_id?: string | null;
          reading_date: string; // Assuming TIMESTAMPTZ stored as string
          month_year: string;
          reading_value: number;
          is_estimate?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          meter_type: 'individual_customer_meter' | 'bulk_meter';
          individual_customer_id?: string | null;
          bulk_meter_id?: string | null;
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
          meter_type?: 'individual_customer_meter' | 'bulk_meter';
          individual_customer_id?: string | null;
          bulk_meter_id?: string | null;
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
          payment_date: string; // Assuming TIMESTAMPTZ stored as string
          amount_paid: number;
          payment_method: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other'; // Assuming payment_method_enum
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
          report_name: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy'; // Assuming report_type_enum
          description?: string | null;
          generated_at: string; // Assuming TIMESTAMPTZ stored as string
          generated_by_staff_id?: string | null;
          parameters?: Json | null; // Assuming JSONB stored as Json
          file_format?: string | null;
          file_name?: string | null;
          status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null; // Assuming report_status_enum
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
        payment_status_enum: 'Paid' | 'Unpaid';
        customer_type_enum: 'Domestic' | 'Non-domestic';
        sewerage_connection_enum: 'Yes' | 'No';
        individual_customer_status_enum: 'Active' | 'Inactive' | 'Suspended';
        staff_status_enum: 'Active' | 'Inactive' | 'On Leave';
        meter_reading_meter_type_enum: 'individual_customer_meter' | 'bulk_meter';
        payment_method_enum: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
        report_type_enum: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
        report_status_enum: 'Generated' | 'Pending' | 'Failed' | 'Archived';
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
}
// --- End Placeholder Database Type ---

// Use ActualDatabase if available (after type generation), otherwise fall back to the placeholder
type ResolvedDatabase = ActualDatabase extends { public: any } ? ActualDatabase : Database;

// Define types for each table based on the resolved Database type
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

export type MeterReading = ResolvedDatabase['public']['Tables']['meter_readings']['Row'];
export type MeterReadingInsert = ResolvedDatabase['public']['Tables']['meter_readings']['Insert'];
export type MeterReadingUpdate = ResolvedDatabase['public']['Tables']['meter_readings']['Update'];

export type Payment = ResolvedDatabase['public']['Tables']['payments']['Row'];
export type PaymentInsert = ResolvedDatabase['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = ResolvedDatabase['public']['Tables']['payments']['Update'];

export type ReportLog = ResolvedDatabase['public']['Tables']['reports']['Row']; // 'reports' is the table name
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

// CRUD for Meter Readings
export const getAllMeterReadings = async () => supabase.from('meter_readings').select('*');
export const createMeterReading = async (reading: MeterReadingInsert) => supabase.from('meter_readings').insert(reading).select().single();
export const updateMeterReading = async (id: string, reading: MeterReadingUpdate) => supabase.from('meter_readings').update(reading).eq('id', id).select().single();
export const deleteMeterReading = async (id: string) => supabase.from('meter_readings').delete().eq('id', id).select().single();

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

    