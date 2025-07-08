
import { Pool } from 'pg';
import type { Database as ActualDatabase } from '@/types/supabase';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// The existing type definitions are kept to maintain type safety throughout the app.
// These types should match your self-hosted PostgreSQL schema.
// ... (The extensive type interface from the original file is maintained here) ...
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

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("PostgreSQL connection string is not defined. Please set POSTGRES_URL.");
}

export const pool = new Pool({
  connectionString,
});

async function query<T>(text: string, params: any[] = []) {
    try {
        const res = await pool.query<T>(text, params);
        return { data: res.rows, error: null };
    } catch (err: any) {
        console.error('Database query error:', err);
        return { data: null, error: { message: err.message, code: err.code } };
    }
}

// Helper to build a dynamic SET clause for updates
function buildUpdateSetClause(payload: Record<string, any>, startingIndex = 1): { clause: string, values: any[] } {
    const keys = Object.keys(payload);
    const clause = keys.map((key, index) => `"${key}" = $${index + startingIndex}`).join(', ');
    const values = keys.map(key => payload[key]);
    return { clause, values };
}

// --- Rewritten CRUD Functions ---

// Authentication
export const getStaffMemberForAuth = async (email: string, password?: string) => {
    const text = `
        SELECT sm.*, r.role_name
        FROM staff_members sm
        LEFT JOIN roles r ON sm.role_id = r.id
        WHERE sm.email = $1 AND sm.password = $2
    `;
    const res = await query<(StaffMember & {role_name: string})>(text, [email, password]);
    return { data: res.data?.[0] || null, error: res.error };
}

// Generic CRUD functions
async function getAll<T>(tableName: string) { return query<T>(`SELECT * FROM ${tableName}`); }
async function deleteById(tableName: string, id: string | number, idColumn = "id") { return query(`DELETE FROM ${tableName} WHERE "${idColumn}" = $1`, [id]); }
async function create<T>(tableName: string, payload: Record<string, any>) {
    const keys = Object.keys(payload).map(k => `"${k}"`);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const text = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const res = await query<T>(text, Object.values(payload));
    return { data: res.data?.[0] || null, error: res.error };
}
async function update<T>(tableName: string, id: string | number, payload: Record<string, any>, idColumn = "id") {
    const { clause, values } = buildUpdateSetClause(payload, 2);
    const text = `UPDATE ${tableName} SET ${clause} WHERE "${idColumn}" = $1 RETURNING *`;
    const res = await query<T>(text, [id, ...values]);
    return { data: res.data?.[0] || null, error: res.error };
}


// Roles & Permissions
export const getAllRoles = () => getAll<RoleRow>('roles');
export const getAllPermissions = () => getAll<PermissionRow>('permissions');
export const getAllRolePermissions = () => getAll<RolePermissionRow>('role_permissions');
export const rpcUpdateRolePermissions = async (roleId: number, permissionIds: number[]) => {
    return query('SELECT update_role_permissions($1, $2)', [roleId, permissionIds]);
}

// Notifications
export const getAllNotifications = () => query<NotificationRow>('SELECT * FROM notifications ORDER BY created_at DESC');
export const createNotification = (notification: NotificationInsert) => {
    return query<NotificationRow>(
        'SELECT insert_notification($1, $2, $3, $4)',
        [notification.title, notification.message, notification.sender_name, notification.target_branch_id]
    ).then(res => ({ data: res.data?.[0], error: res.error }));
}

// Branches
export const getAllBranches = () => getAll<Branch>('branches');
export const createBranch = (branch: BranchInsert) => create<Branch>('branches', branch);
export const updateBranch = (id: string, branch: BranchUpdate) => update<Branch>('branches', id, branch);
export const deleteBranch = (id: string) => deleteById('branches', id);

// Bulk Meters
export const getAllBulkMeters = () => getAll<BulkMeterRow>('bulk_meters');
export const createBulkMeter = (bulkMeter: BulkMeterInsert) => create<BulkMeterRow>('bulk_meters', bulkMeter);
export const updateBulkMeter = (customerKeyNumber: string, bulkMeter: BulkMeterUpdate) => update<BulkMeterRow>('bulk_meters', customerKeyNumber, bulkMeter, 'customerKeyNumber');
export const deleteBulkMeter = (customerKeyNumber: string) => deleteById('bulk_meters', customerKeyNumber, 'customerKeyNumber');

// Individual Customers
export const getAllCustomers = () => getAll<IndividualCustomer>('individual_customers');
export const createCustomer = (customer: IndividualCustomerInsert) => create<IndividualCustomer>('individual_customers', customer);
export const updateCustomer = (customerKeyNumber: string, customer: IndividualCustomerUpdate) => update<IndividualCustomer>('individual_customers', customerKeyNumber, customer, 'customerKeyNumber');
export const deleteCustomer = (customerKeyNumber: string) => deleteById('individual_customers', customerKeyNumber, 'customerKeyNumber');

// Staff Members
export const getAllStaffMembers = () => getAll<StaffMember>('staff_members');
export const createStaffMember = (staffMember: StaffMemberInsert) => create<StaffMember>('staff_members', staffMember);
export const updateStaffMember = (email: string, staffMember: StaffMemberUpdate) => update<StaffMember>('staff_members', email, staffMember, 'email');
export const deleteStaffMember = (email: string) => deleteById('staff_members', email, 'email');

// Bills
export const getAllBills = () => getAll<Bill>('bills');
export const createBill = (bill: BillInsert) => create<Bill>('bills', bill);
export const updateBill = (id: string, bill: BillUpdate) => update<Bill>('bills', id, bill);
export const deleteBill = (id: string) => deleteById('bills', id);

// Individual Customer Readings
export const getAllIndividualCustomerReadings = () => getAll<IndividualCustomerReading>('individual_customer_readings');
export const createIndividualCustomerReading = (reading: IndividualCustomerReadingInsert) => create<IndividualCustomerReading>('individual_customer_readings', reading);
export const updateIndividualCustomerReading = (id: string, reading: IndividualCustomerReadingUpdate) => update<IndividualCustomerReading>('individual_customer_readings', id, reading);
export const deleteIndividualCustomerReading = (id: string) => deleteById('individual_customer_readings', id);

// Bulk Meter Readings
export const getAllBulkMeterReadings = () => getAll<BulkMeterReading>('bulk_meter_readings');
export const createBulkMeterReading = (reading: BulkMeterReadingInsert) => create<BulkMeterReading>('bulk_meter_readings', reading);
export const updateBulkMeterReading = (id: string, reading: BulkMeterReadingUpdate) => update<BulkMeterReading>('bulk_meter_readings', id, reading);
export const deleteBulkMeterReading = (id: string) => deleteById('bulk_meter_readings', id);

// Payments
export const getAllPayments = () => getAll<Payment>('payments');
export const createPayment = (payment: PaymentInsert) => create<Payment>('payments', payment);
export const updatePayment = (id: string, payment: PaymentUpdate) => update<Payment>('payments', id, payment);
export const deletePayment = (id: string) => deleteById('payments', id);

// Report Logs
export const getAllReportLogs = () => getAll<ReportLog>('reports');
export const createReportLog = (reportLog: ReportLogInsert) => create<ReportLog>('reports', reportLog);
export const updateReportLog = (id: string, reportLog: ReportLogUpdate) => update<ReportLog>('reports', id, reportLog);
export const deleteReportLog = (id: string) => deleteById('reports', id);
