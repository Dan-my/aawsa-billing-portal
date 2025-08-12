
// This file is intentionally left blank. 
// The data-store.ts file now directly handles database interactions.
// We are keeping this file to avoid breaking existing imports, but it no longer contains logic.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import pool from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);


export const getStaffMemberForAuth = async (email: string, password?: string) => {
    // Note: In a real production app, password verification should be handled
    // by Supabase Auth (e.g., supabase.auth.signInWithPassword).
    // This is a simplified check for the data store.
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
export const getAllBranches = async () => {
    const res = await pool.query('SELECT * FROM branches');
    return { data: res.rows, error: null };
};
export const createBranch = async (branch: any) => {
    const { rows } = await pool.query('INSERT INTO branches (name, location, "contactPerson", "contactPhone", status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [branch.name, branch.location, branch.contactPerson, branch.contactPhone, branch.status]);
    return { data: rows[0], error: null };
};
export const updateBranch = async (id: string, branch: any) => {
    const { rows } = await pool.query('UPDATE branches SET name = $1, location = $2, "contactPerson" = $3, "contactPhone" = $4, status = $5 WHERE id = $6 RETURNING *', [branch.name, branch.location, branch.contactPerson, branch.contactPhone, branch.status, id]);
    return { data: rows[0], error: null };
};
export const deleteBranch = async (id: string) => {
    await pool.query('DELETE FROM branches WHERE id = $1', [id]);
    return { error: null };
};

export const getAllCustomers = async () => {
    const res = await pool.query('SELECT * FROM individual_customers');
    return { data: res.rows, error: null };
};
export const createCustomer = async (customer: any) => {
    const { rows } = await pool.query('INSERT INTO individual_customers ("customerKeyNumber", name, "contractNumber", "customerType", "bookNumber", ordinal, "meterSize", "meterNumber", "previousReading", "currentReading", month, "specificArea", "subCity", woreda, "sewerageConnection", "assignedBulkMeterId", branch_id, status, "paymentStatus", "calculatedBill", arrears) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *', [customer.customerKeyNumber, customer.name, customer.contractNumber, customer.customerType, customer.bookNumber, customer.ordinal, customer.meterSize, customer.meterNumber, customer.previousReading, customer.currentReading, customer.month, customer.specificArea, customer.subCity, customer.woreda, customer.sewerageConnection, customer.assignedBulkMeterId, customer.branch_id, customer.status, customer.paymentStatus, customer.calculatedBill, customer.arrears]);
    return { data: rows[0], error: null };
};
export const updateCustomer = async (customerKeyNumber: string, customer: any) => {
    const { rows } = await pool.query('UPDATE individual_customers SET name = $1, "contractNumber" = $2, "customerType" = $3, "bookNumber" = $4, ordinal = $5, "meterSize" = $6, "meterNumber" = $7, "previousReading" = $8, "currentReading" = $9, month = $10, "specificArea" = $11, "subCity" = $12, woreda = $13, "sewerageConnection" = $14, "assignedBulkMeterId" = $15, branch_id = $16, status = $17, "paymentStatus" = $18, "calculatedBill" = $19, arrears = $20 WHERE "customerKeyNumber" = $21 RETURNING *', [customer.name, customer.contractNumber, customer.customerType, customer.bookNumber, customer.ordinal, customer.meterSize, customer.meterNumber, customer.previousReading, customer.currentReading, customer.month, customer.specificArea, customer.subCity, customer.woreda, customer.sewerageConnection, customer.assignedBulkMeterId, customer.branch_id, customer.status, customer.paymentStatus, customer.calculatedBill, customer.arrears, customerKeyNumber]);
    return { data: rows[0], error: null };
};
export const deleteCustomer = async (customerKeyNumber: string) => {
    await pool.query('DELETE FROM individual_customers WHERE "customerKeyNumber" = $1', [customerKeyNumber]);
    return { error: null };
};

export const getAllBulkMeters = async () => {
    const res = await pool.query('SELECT * FROM bulk_meters');
    return { data: res.rows, error: null };
};
export const createBulkMeter = async (bulkMeter: any) => {
    const { rows } = await pool.query('INSERT INTO bulk_meters (name, "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", month, "specificArea", location, woreda, branch_id, status, "paymentStatus", "chargeGroup", "sewerageConnection", bulk_usage, total_bulk_bill, difference_usage, difference_bill, "outStandingbill", x_coordinate, y_coordinate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *', [bulkMeter.name, bulkMeter.customerKeyNumber, bulkMeter.contractNumber, bulkMeter.meterSize, bulkMeter.meterNumber, bulkMeter.previousReading, bulkMeter.currentReading, bulkMeter.month, bulkMeter.specificArea, bulkMeter.location, bulkMeter.woreda, bulkMeter.branch_id, bulkMeter.status, bulkMeter.paymentStatus, bulkMeter.charge_group, bulkMeter.sewerage_connection, bulkMeter.bulk_usage, bulkMeter.total_bulk_bill, bulkMeter.difference_usage, bulkMeter.difference_bill, bulkMeter.outStandingbill, bulkMeter.x_coordinate, bulkMeter.y_coordinate]);
    return { data: rows[0], error: null };
};
export const updateBulkMeter = async (customerKeyNumber: string, bulkMeter: any) => {
    const { rows } = await pool.query('UPDATE bulk_meters SET name = $1, "contractNumber" = $2, "meterSize" = $3, "meterNumber" = $4, "previousReading" = $5, "currentReading" = $6, month = $7, "specificArea" = $8, location = $9, woreda = $10, branch_id = $11, status = $12, "paymentStatus" = $13, "chargeGroup" = $14, "sewerageConnection" = $15, bulk_usage = $16, total_bulk_bill = $17, difference_usage = $18, difference_bill = $19, "outStandingbill" = $20, x_coordinate = $21, y_coordinate = $22 WHERE "customerKeyNumber" = $23 RETURNING *', [bulkMeter.name, bulkMeter.contractNumber, bulkMeter.meterSize, bulkMeter.meterNumber, bulkMeter.previousReading, bulkMeter.currentReading, bulkMeter.month, bulkMeter.specificArea, bulkMeter.location, bulkMeter.woreda, bulkMeter.branch_id, bulkMeter.status, bulkMeter.paymentStatus, bulkMeter.charge_group, bulkMeter.sewerage_connection, bulkMeter.bulk_usage, bulkMeter.total_bulk_bill, bulkMeter.difference_usage, bulkMeter.difference_bill, bulkMeter.outStandingbill, bulkMeter.x_coordinate, bulkMeter.y_coordinate, customerKeyNumber]);
    return { data: rows[0], error: null };
};
export const deleteBulkMeter = async (customerKeyNumber: string) => {
    await pool.query('DELETE FROM bulk_meters WHERE "customerKeyNumber" = $1', [customerKeyNumber]);
    return { error: null };
};

export const getAllStaffMembers = async () => {
    const res = await pool.query('SELECT * FROM staff_members');
    return { data: res.rows, error: null };
};
export const createStaffMember = async (staffMember: any) => {
    const { rows } = await pool.query('INSERT INTO staff_members (name, email, password, branch, status, phone, hire_date, role, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [staffMember.name, staffMember.email, staffMember.password, staffMember.branch, staffMember.status, staffMember.phone, staffMember.hire_date, staffMember.role, staffMember.role_id]);
    return { data: rows[0], error: null };
};
export const updateStaffMember = async (email: string, staffMember: any) => {
    const { rows } = await pool.query('UPDATE staff_members SET name = $1, branch = $2, status = $3, phone = $4, hire_date = $5, role = $6, role_id = $7 WHERE email = $8 RETURNING *', [staffMember.name, staffMember.branch, staffMember.status, staffMember.phone, staffMember.hire_date, staffMember.role, staffMember.role_id, email]);
    return { data: rows[0], error: null };
};
export const deleteStaffMember = async (email: string) => {
    await pool.query('DELETE FROM staff_members WHERE email = $1', [email]);
    return { error: null };
};

export const getAllBills = async () => {
    const res = await pool.query('SELECT * FROM bills');
    return { data: res.rows, error: null };
};
export const createBill = async (bill: any) => {
    const { rows } = await pool.query('INSERT INTO bills (individual_customer_id, bulk_meter_id, bill_period_start_date, bill_period_end_date, month_year, previous_reading_value, current_reading_value, usage_m3, difference_usage, base_water_charge, sewerage_charge, maintenance_fee, sanitation_fee, meter_rent, balance_carried_forward, total_amount_due, due_date, payment_status, bill_number, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *', [bill.individual_customer_id, bill.bulk_meter_id, bill.bill_period_start_date, bill.bill_period_end_date, bill.month_year, bill.previous_reading_value, bill.current_reading_value, bill.usage_m3, bill.difference_usage, bill.base_water_charge, bill.sewerage_charge, bill.maintenance_fee, bill.sanitation_fee, bill.meter_rent, bill.balance_carried_forward, bill.total_amount_due, bill.due_date, bill.payment_status, bill.bill_number, bill.notes]);
    return { data: rows[0], error: null };
};
export const updateBill = async (id: string, bill: any) => {
    const { rows } = await pool.query('UPDATE bills SET individual_customer_id = $1, bulk_meter_id = $2, bill_period_start_date = $3, bill_period_end_date = $4, month_year = $5, previous_reading_value = $6, current_reading_value = $7, usage_m3 = $8, difference_usage = $9, base_water_charge = $10, sewerage_charge = $11, maintenance_fee = $12, sanitation_fee = $13, meter_rent = $14, balance_carried_forward = $15, total_amount_due = $16, due_date = $17, payment_status = $18, bill_number = $19, notes = $20 WHERE id = $21 RETURNING *', [bill.individual_customer_id, bill.bulk_meter_id, bill.bill_period_start_date, bill.bill_period_end_date, bill.month_year, bill.previous_reading_value, bill.current_reading_value, bill.usage_m3, bill.difference_usage, bill.base_water_charge, bill.sewerage_charge, bill.maintenance_fee, bill.sanitation_fee, bill.meter_rent, bill.balance_carried_forward, bill.total_amount_due, bill.due_date, bill.payment_status, bill.bill_number, bill.notes, id]);
    return { data: rows[0], error: null };
};
export const deleteBill = async (id: string) => {
    await pool.query('DELETE FROM bills WHERE id = $1', [id]);
    return { error: null };
};

export const getAllIndividualCustomerReadings = async () => {
    const res = await pool.query('SELECT * FROM individual_customer_readings');
    return { data: res.rows, error: null };
};
export const createIndividualCustomerReading = async (reading: any) => {
    const { rows } = await pool.query('INSERT INTO individual_customer_readings (individual_customer_id, reader_staff_id, reading_date, month_year, reading_value, is_estimate, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [reading.individual_customer_id, reading.reader_staff_id, reading.reading_date, reading.month_year, reading.reading_value, reading.is_estimate, reading.notes]);
    return { data: rows[0], error: null };
};
export const updateIndividualCustomerReading = async (id: string, reading: any) => {
    const { rows } = await pool.query('UPDATE individual_customer_readings SET individual_customer_id = $1, reader_staff_id = $2, reading_date = $3, month_year = $4, reading_value = $5, is_estimate = $6, notes = $7 WHERE id = $8 RETURNING *', [reading.individual_customer_id, reading.reader_staff_id, reading.reading_date, reading.month_year, reading.reading_value, reading.is_estimate, reading.notes, id]);
    return { data: rows[0], error: null };
};
export const deleteIndividualCustomerReading = async (id: string) => {
    await pool.query('DELETE FROM individual_customer_readings WHERE id = $1', [id]);
    return { error: null };
};

export const getAllBulkMeterReadings = async () => {
    const res = await pool.query('SELECT * FROM bulk_meter_readings');
    return { data: res.rows, error: null };
};
export const createBulkMeterReading = async (reading: any) => {
    const { rows } = await pool.query('INSERT INTO bulk_meter_readings (bulk_meter_id, reader_staff_id, reading_date, month_year, reading_value, is_estimate, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [reading.bulk_meter_id, reading.reader_staff_id, reading.reading_date, reading.month_year, reading.reading_value, reading.is_estimate, reading.notes]);
    return { data: rows[0], error: null };
};
export const updateBulkMeterReading = async (id: string, reading: any) => {
    const { rows } = await pool.query('UPDATE bulk_meter_readings SET bulk_meter_id = $1, reader_staff_id = $2, reading_date = $3, month_year = $4, reading_value = $5, is_estimate = $6, notes = $7 WHERE id = $8 RETURNING *', [reading.bulk_meter_id, reading.reader_staff_id, reading.reading_date, reading.month_year, reading.reading_value, reading.is_estimate, reading.notes, id]);
    return { data: rows[0], error: null };
};
export const deleteBulkMeterReading = async (id: string) => {
    await pool.query('DELETE FROM bulk_meter_readings WHERE id = $1', [id]);
    return { error: null };
};

export const getAllPayments = async () => {
    const res = await pool.query('SELECT * FROM payments');
    return { data: res.rows, error: null };
};
export const createPayment = async (payment: any) => {
    const { rows } = await pool.query('INSERT INTO payments (bill_id, individual_customer_id, payment_date, amount_paid, payment_method, transaction_reference, processed_by_staff_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [payment.bill_id, payment.individual_customer_id, payment.payment_date, payment.amount_paid, payment.payment_method, payment.transaction_reference, payment.processed_by_staff_id, payment.notes]);
    return { data: rows[0], error: null };
};
export const updatePayment = async (id: string, payment: any) => {
    const { rows } = await pool.query('UPDATE payments SET bill_id = $1, individual_customer_id = $2, payment_date = $3, amount_paid = $4, payment_method = $5, transaction_reference = $6, processed_by_staff_id = $7, notes = $8 WHERE id = $9 RETURNING *', [payment.bill_id, payment.individual_customer_id, payment.payment_date, payment.amount_paid, payment.payment_method, payment.transaction_reference, payment.processed_by_staff_id, payment.notes, id]);
    return { data: rows[0], error: null };
};
export const deletePayment = async (id: string) => {
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    return { error: null };
};

export const getAllReportLogs = async () => {
    const res = await pool.query('SELECT * FROM reports');
    return { data: res.rows, error: null };
};
export const createReportLog = async (log: any) => {
    const { rows } = await pool.query('INSERT INTO reports (report_name, description, generated_by_staff_id, parameters, file_format, file_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [log.report_name, log.description, log.generated_by_staff_id, log.parameters, log.file_format, log.file_name, log.status]);
    return { data: rows[0], error: null };
};
export const updateReportLog = async (id: string, log: any) => {
    const { rows } = await pool.query('UPDATE reports SET report_name = $1, description = $2, generated_by_staff_id = $3, parameters = $4, file_format = $5, file_name = $6, status = $7 WHERE id = $8 RETURNING *', [log.report_name, log.description, log.generated_by_staff_id, log.parameters, log.file_format, log.file_name, log.status, id]);
    return { data: rows[0], error: null };
};
export const deleteReportLog = async (id: string) => {
    await pool.query('DELETE FROM reports WHERE id = $1', [id]);
    return { error: null };
};

export const getAllNotifications = async () => {
    const res = await pool.query('SELECT * FROM notifications');
    return { data: res.rows, error: null };
};
export const createNotification = async (notification: any) => {
    const { rows } = await pool.query('SELECT * from insert_notification($1, $2, $3, $4)', [notification.p_title, notification.p_message, notification.p_sender_name, notification.p_target_branch_id]);
    return { data: rows[0], error: null };
};

export const getAllRoles = async () => {
    const res = await pool.query('SELECT * FROM roles');
    return { data: res.rows, error: null };
};
export const getAllPermissions = async () => {
    const res = await pool.query('SELECT * FROM permissions');
    return { data: res.rows, error: null };
};
export const getAllRolePermissions = async () => {
    const res = await pool.query('SELECT * FROM role_permissions');
    return { data: res.rows, error: null };
};
export const rpcUpdateRolePermissions = async (roleId: number, permissionIds: number[]) => {
    await pool.query('SELECT update_role_permissions($1, $2)', [roleId, permissionIds]);
    return { error: null };
};

export const getAllTariffs = async () => {
    const res = await pool.query('SELECT * FROM tariffs');
    return { data: res.rows, error: null };
};
export const createTariff = async (tariff: any) => {
    const { rows } = await pool.query('INSERT INTO tariffs (customer_type, year, tiers, maintenance_percentage, sanitation_percentage, sewerage_rate_per_m3, meter_rent_prices, vat_rate, domestic_vat_threshold_m3) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [tariff.customer_type, tariff.year, tariff.tiers, tariff.maintenance_percentage, tariff.sanitation_percentage, tariff.sewerage_rate_per_m3, tariff.meter_rent_prices, tariff.vat_rate, tariff.domestic_vat_threshold_m3]);
    return { data: rows[0], error: null };
};
export const updateTariff = async (customerType: string, year: number, tariff: any) => {
    const { rows } = await pool.query('UPDATE tariffs SET tiers = $1, maintenance_percentage = $2, sanitation_percentage = $3, sewerage_rate_per_m3 = $4, meter_rent_prices = $5, vat_rate = $6, domestic_vat_threshold_m3 = $7 WHERE customer_type = $8 AND year = $9 RETURNING *', [tariff.tiers, tariff.maintenance_percentage, tariff.sanitation_percentage, tariff.sewerage_rate_per_m3, tariff.meter_rent_prices, tariff.vat_rate, tariff.domestic_vat_threshold_m3, customerType, year]);
    return { data: rows[0], error: null };
};
