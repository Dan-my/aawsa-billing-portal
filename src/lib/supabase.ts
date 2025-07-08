
import { createClient } from '@supabase/supabase-js';
import type { Database as ActualDatabase } from '@/types/supabase';

// This is a fallback definition. In a typical Supabase project, you would generate
// this with the Supabase CLI and it would live in a file like `types/supabase.ts`.
export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number;
          role_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          role_name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          role_name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      permissions: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          category?: string;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: number;
          permission_id: number;
          created_at: string;
        };
        Insert: {
          role_id: number;
          permission_id: number;
          created_at?: string;
        };
        Update: {
          role_id?: number;
          permission_id?: number;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          message: string;
          sender_name: string;
          target_branch_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          message: string;
          sender_name: string;
          target_branch_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          message?: string;
          sender_name?: string;
          target_branch_id?: string | null;
        };
      };
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
          x_coordinate?: number | null;
          y_coordinate?: number | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        };
        Insert: {
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
          x_coordinate?: number | null;
          y_coordinate?: number | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        };
        Update: {
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
          x_coordinate?: number | null;
          y_coordinate?: number | null;
          createdAt?: string | null;
          updatedAt?: string | null;
        };
      };
      individual_customers: {
        Row: {
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
          role: string;
          role_id?: number | null; // Added
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
          role: string;
          role_id?: number | null; // Added
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
          role?: string;
          role_id?: number | null; // Added
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
          difference_usage?: number | null;
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
          usage_m3?: number | null;
          difference_usage?: number | null;
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
          usage_m3?: number | null;
          difference_usage?: number | null;
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
      insert_notification: {
        Args: {
          p_title: string
          p_message: string
          p_sender_name: string
          p_target_branch_id: string | null
        }
        Returns: {
            id: string;
            created_at: string;
            title: string;
            message: string;
            sender_name: string;
            target_branch_id: string | null;
        }[]
      },
      update_role_permissions: {
          Args: {
            p_role_id: number;
            p_permission_ids: number[];
          };
          Returns: void;
      };
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

export type RoleRow = ResolvedDatabase['public']['Tables']['roles']['Row'];
export type PermissionRow = ResolvedDatabase['public']['Tables']['permissions']['Row'];
export type RolePermissionRow = ResolvedDatabase['public']['Tables']['role_permissions']['Row'];
export type RoleInsert = ResolvedDatabase['public']['Tables']['roles']['Insert'];

export type NotificationRow = ResolvedDatabase['public']['Tables']['notifications']['Row'];
export type NotificationInsert = ResolvedDatabase['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = ResolvedDatabase['public']['Tables']['notifications']['Update'];

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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is not defined. Please check your .env file.");
}

export const supabase = createClient<ResolvedDatabase>(supabaseUrl, supabaseKey);

// --- Rewritten CRUD Functions with Supabase Client ---

// Authentication
export const getStaffMemberForAuth = async (email: string, password?: string) => {
    return supabase
        .from('staff_members')
        .select(`*, roles ( role_name )`)
        .eq('email', email)
        .eq('password', password || '')
        .single();
}

// Roles & Permissions
export const getAllRoles = () => supabase.from('roles').select('*');
export const getAllPermissions = () => supabase.from('permissions').select('*');
export const getAllRolePermissions = () => supabase.from('role_permissions').select('*');
export const rpcUpdateRolePermissions = async (roleId: number, permissionIds: number[]) => {
    return supabase.rpc('update_role_permissions', { p_role_id: roleId, p_permission_ids: permissionIds });
}

// Notifications
export const getAllNotifications = () => supabase.from('notifications').select('*').order('created_at', { ascending: false });
export const createNotification = async (notification: NotificationInsert) => {
    return supabase.rpc('insert_notification', {
        p_title: notification.title,
        p_message: notification.message,
        p_sender_name: notification.sender_name,
        p_target_branch_id: notification.target_branch_id
    }).single();
}

// Branches
export const getAllBranches = () => supabase.from('branches').select('*');
export const createBranch = (branch: BranchInsert) => supabase.from('branches').insert(branch).select().single();
export const updateBranch = (id: string, branch: BranchUpdate) => supabase.from('branches').update(branch).eq('id', id).select().single();
export const deleteBranch = (id: string) => supabase.from('branches').delete().eq('id', id);

// Bulk Meters
export const getAllBulkMeters = () => supabase.from('bulk_meters').select('*');
export const createBulkMeter = (bulkMeter: BulkMeterInsert) => supabase.from('bulk_meters').insert(bulkMeter).select().single();
export const updateBulkMeter = (customerKeyNumber: string, bulkMeter: BulkMeterUpdate) => supabase.from('bulk_meters').update(bulkMeter).eq('customerKeyNumber', customerKeyNumber).select().single();
export const deleteBulkMeter = (customerKeyNumber: string) => supabase.from('bulk_meters').delete().eq('customerKeyNumber', customerKeyNumber);

// Individual Customers
export const getAllCustomers = () => supabase.from('individual_customers').select('*');
export const createCustomer = (customer: IndividualCustomerInsert) => supabase.from('individual_customers').insert(customer).select().single();
export const updateCustomer = (customerKeyNumber: string, customer: IndividualCustomerUpdate) => supabase.from('individual_customers').update(customer).eq('customerKeyNumber', customerKeyNumber).select().single();
export const deleteCustomer = (customerKeyNumber: string) => supabase.from('individual_customers').delete().eq('customerKeyNumber', customerKeyNumber);

// Staff Members
export const getAllStaffMembers = () => supabase.from('staff_members').select('*');
export const createStaffMember = (staffMember: StaffMemberInsert) => supabase.from('staff_members').insert(staffMember).select().single();
export const updateStaffMember = (email: string, staffMember: StaffMemberUpdate) => supabase.from('staff_members').update(staffMember).eq('email', email).select().single();
export const deleteStaffMember = (email: string) => supabase.from('staff_members').delete().eq('email', email);

// Bills
export const getAllBills = () => supabase.from('bills').select('*');
export const createBill = (bill: BillInsert) => supabase.from('bills').insert(bill).select().single();
export const updateBill = (id: string, bill: BillUpdate) => supabase.from('bills').update(bill).eq('id', id).select().single();
export const deleteBill = (id: string) => supabase.from('bills').delete().eq('id', id);

// Individual Customer Readings
export const getAllIndividualCustomerReadings = () => supabase.from('individual_customer_readings').select('*');
export const createIndividualCustomerReading = (reading: IndividualCustomerReadingInsert) => supabase.from('individual_customer_readings').insert(reading).select().single();
export const updateIndividualCustomerReading = (id: string, reading: IndividualCustomerReadingUpdate) => supabase.from('individual_customer_readings').update(reading).eq('id', id).select().single();
export const deleteIndividualCustomerReading = (id: string) => supabase.from('individual_customer_readings').delete().eq('id', id);

// Bulk Meter Readings
export const getAllBulkMeterReadings = () => supabase.from('bulk_meter_readings').select('*');
export const createBulkMeterReading = (reading: BulkMeterReadingInsert) => supabase.from('bulk_meter_readings').insert(reading).select().single();
export const updateBulkMeterReading = (id: string, reading: BulkMeterReadingUpdate) => supabase.from('bulk_meter_readings').update(reading).eq('id', id).select().single();
export const deleteBulkMeterReading = (id: string) => supabase.from('bulk_meter_readings').delete().eq('id', id);

// Payments
export const getAllPayments = () => supabase.from('payments').select('*');
export const createPayment = (payment: PaymentInsert) => supabase.from('payments').insert(payment).select().single();
export const updatePayment = (id: string, payment: PaymentUpdate) => supabase.from('payments').update(payment).eq('id', id).select().single();
export const deletePayment = (id: string) => supabase.from('payments').delete().eq('id', id);

// Report Logs
export const getAllReportLogs = () => supabase.from('reports').select('*');
export const createReportLog = (reportLog: ReportLogInsert) => supabase.from('reports').insert(reportLog).select().single();
export const updateReportLog = (id: string, reportLog: ReportLogUpdate) => supabase.from('reports').update(reportLog).eq('id', id).select().single();
export const deleteReportLog = (id: string) => supabase.from('reports').delete().eq('id', id);
