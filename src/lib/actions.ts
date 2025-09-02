

'use server';

import {
  createBranch as dbCreateBranch,
  deleteBranch as dbDeleteBranch,
  getAllBranches as dbGetAllBranches,
  updateBranch as dbUpdateBranch,
  createCustomer as dbCreateCustomer,
  deleteCustomer as dbDeleteCustomer,
  getAllCustomers as dbGetAllCustomers,
  updateCustomer as dbUpdateCustomer,
  createBulkMeter as dbCreateBulkMeter,
  deleteBulkMeter as dbDeleteBulkMeter,
  getAllBulkMeters as dbGetAllBulkMeters,
  updateBulkMeter as dbUpdateBulkMeter,
  createStaffMember as dbCreateStaffMember,
  deleteStaffMember as dbDeleteStaffMember,
  getAllStaffMembers as dbGetAllStaffMembers,
  updateStaffMember as dbUpdateStaffMember,
  getStaffMemberForAuth as dbGetStaffMemberForAuth,
  createBill as dbCreateBill,
  deleteBill as dbDeleteBill,
  getAllBills as dbGetAllBills,
  updateBill as dbUpdateBill,
  createIndividualCustomerReading as dbCreateIndividualCustomerReading,
  deleteIndividualCustomerReading as dbDeleteIndividualCustomerReading,
  getAllIndividualCustomerReadings as dbGetAllIndividualCustomerReadings,
  updateIndividualCustomerReading as dbUpdateIndividualCustomerReading,
  createBulkMeterReading as dbCreateBulkMeterReading,
  deleteBulkMeterReading as dbDeleteBulkMeterReading,
  getAllBulkMeterReadings as dbGetAllBulkMeterReadings,
  updateBulkMeterReading as dbUpdateBulkMeterReading,
  createPayment as dbCreatePayment,
  deletePayment as dbDeletePayment,
  getAllPayments as dbGetAllPayments,
  updatePayment as dbUpdatePayment,
  createReportLog as dbCreateReportLog,
  deleteReportLog as dbDeleteReportLog,
  getAllReportLogs as dbGetAllReportLogs,
  updateReportLog as dbUpdateReportLog,
  createNotification as dbCreateNotification,
  getAllNotifications as dbGetAllNotifications,
  getAllRoles as dbGetAllRoles,
  getAllPermissions as dbGetAllPermissions,
  getAllRolePermissions as dbGetAllRolePermissions,
  rpcUpdateRolePermissions as dbRpcUpdateRolePermissions,
  getAllTariffs as dbGetAllTariffs,
  createTariff as dbCreateTariff,
  updateTariff as dbUpdateTariff,
} from './db-queries';

import type { Database } from '@/types/supabase';

// Helper types to extract Row, Insert, and Update types from the database definition
type PublicTables = Database['public']['Tables'];
type RoleRow = PublicTables['roles']['Row'];
type PermissionRow = PublicTables['permissions']['Row'];
type RolePermissionRow = PublicTables['role_permissions']['Row'];
type Branch = PublicTables['branches']['Row'];
type BulkMeterRow = PublicTables['bulk_meters']['Row'];
type IndividualCustomer = PublicTables['individual_customers']['Row'];
type StaffMember = PublicTables['staff_members']['Row'];
type Bill = PublicTables['bills']['Row'];
type IndividualCustomerReading = PublicTables['individual_customer_readings']['Row'];
type BulkMeterReading = PublicTables['bulk_meter_readings']['Row'];
type Payment = PublicTables['payments']['Row'];
type ReportLog = PublicTables['reports']['Row'];
type NotificationRow = PublicTables['notifications']['Row'];
type TariffRow = PublicTables['tariffs']['Row'];

type BranchInsert = PublicTables['branches']['Insert'];
type BranchUpdate = PublicTables['branches']['Update'];
type BulkMeterInsert = PublicTables['bulk_meters']['Insert'];
type BulkMeterUpdate = PublicTables['bulk_meters']['Update'];
type IndividualCustomerInsert = PublicTables['individual_customers']['Insert'];
type IndividualCustomerUpdate = PublicTables['individual_customers']['Update'];
type StaffMemberInsert = PublicTables['staff_members']['Insert'];
type StaffMemberUpdate = PublicTables['staff_members']['Update'];
type BillInsert = PublicTables['bills']['Insert'];
type BillUpdate = PublicTables['bills']['Update'];
type IndividualCustomerReadingInsert = PublicTables['individual_customer_readings']['Insert'];
type IndividualCustomerReadingUpdate = PublicTables['individual_customer_readings']['Update'];
type BulkMeterReadingInsert = PublicTables['bulk_meter_readings']['Insert'];
type BulkMeterReadingUpdate = PublicTables['bulk_meter_readings']['Update'];
type PaymentInsert = PublicTables['payments']['Insert'];
type PaymentUpdate = PublicTables['payments']['Update'];
type ReportLogInsert = PublicTables['reports']['Insert'];
type ReportLogUpdate = PublicTables['reports']['Update'];
type NotificationInsert = PublicTables['notifications']['Insert'];
type TariffInsert = PublicTables['tariffs']['Insert'];
type TariffUpdate = PublicTables['tariffs']['Update'];


export type { RoleRow, PermissionRow, RolePermissionRow, Branch, BulkMeterRow, IndividualCustomer, StaffMember, Bill, IndividualCustomerReading, BulkMeterReading, Payment, ReportLog, NotificationRow, BranchInsert, BranchUpdate, BulkMeterInsert, BulkMeterUpdate, IndividualCustomerInsert, IndividualCustomerUpdate, StaffMemberInsert, StaffMemberUpdate, BillInsert, BillUpdate, IndividualCustomerReadingInsert, IndividualCustomerReadingUpdate, BulkMeterReadingInsert, BulkMeterReadingUpdate, PaymentInsert, PaymentUpdate, ReportLogInsert, ReportLogUpdate, NotificationInsert, TariffRow, TariffInsert, TariffUpdate };


export async function getAllBranchesAction() { return dbGetAllBranches(); }
export async function createBranchAction(branch: BranchInsert) { return dbCreateBranch(branch); }
export async function updateBranchAction(id: string, branch: BranchUpdate) { return dbUpdateBranch(id, branch); }
export async function deleteBranchAction(id: string) { return dbDeleteBranch(id); }

export async function getAllCustomersAction() { return dbGetAllCustomers(); }
export async function createCustomerAction(customer: IndividualCustomerInsert) { return dbCreateCustomer(customer); }
export async function updateCustomerAction(customerKeyNumber: string, customer: IndividualCustomerUpdate) { return dbUpdateCustomer(customerKeyNumber, customer); }
export async function deleteCustomerAction(customerKeyNumber: string) { return dbDeleteCustomer(customerKeyNumber); }

export async function getAllBulkMetersAction() { return dbGetAllBulkMeters(); }
export async function createBulkMeterAction(bulkMeter: BulkMeterInsert) { return dbCreateBulkMeter(bulkMeter); }
export async function updateBulkMeterAction(customerKeyNumber: string, bulkMeter: BulkMeterUpdate) { return dbUpdateBulkMeter(customerKeyNumber, bulkMeter); }
export async function deleteBulkMeterAction(customerKeyNumber: string) { return dbDeleteBulkMeter(customerKeyNumber); }

export async function getAllStaffMembersAction() { return dbGetAllStaffMembers(); }
export async function createStaffMemberAction(staffMember: StaffMemberInsert) { return dbCreateStaffMember(staffMember); }
export async function updateStaffMemberAction(email: string, staffMember: StaffMemberUpdate) { return dbUpdateStaffMember(email, staffMember); }
export async function deleteStaffMemberAction(email: string) { return dbDeleteStaffMember(email); }
export async function getStaffMemberForAuthAction(email: string, password?: string) { return dbGetStaffMemberForAuth(email, password); }

export async function getAllBillsAction() { return dbGetAllBills(); }
export async function createBillAction(bill: BillInsert) { return dbCreateBill(bill); }
export async function updateBillAction(id: string, bill: BillUpdate) { return dbUpdateBill(id, bill); }
export async function deleteBillAction(id: string) { return dbDeleteBill(id); }

export async function getAllIndividualCustomerReadingsAction() { return dbGetAllIndividualCustomerReadings(); }
export async function createIndividualCustomerReadingAction(reading: IndividualCustomerReadingInsert) { return dbCreateIndividualCustomerReading(reading); }
export async function updateIndividualCustomerReadingAction(id: string, reading: IndividualCustomerReadingUpdate) { return dbUpdateIndividualCustomerReading(id, reading); }
export async function deleteIndividualCustomerReadingAction(id: string) { return dbDeleteIndividualCustomerReading(id); }

export async function getAllBulkMeterReadingsAction() { return dbGetAllBulkMeterReadings(); }
export async function createBulkMeterReadingAction(reading: BulkMeterReadingInsert) { return dbCreateBulkMeterReading(reading); }
export async function updateBulkMeterReadingAction(id: string, reading: BulkMeterReadingUpdate) { return dbUpdateBulkMeterReading(id, reading); }
export async function deleteBulkMeterReadingAction(id: string) { return dbDeleteBulkMeterReading(id); }

export async function getAllPaymentsAction() { return dbGetAllPayments(); }
export async function createPaymentAction(payment: PaymentInsert) { return dbCreatePayment(payment); }
export async function updatePaymentAction(id: string, payment: PaymentUpdate) { return dbUpdatePayment(id, payment); }
export async function deletePaymentAction(id: string) { return dbDeletePayment(id); }

export async function getAllReportLogsAction() { return dbGetAllReportLogs(); }
export async function createReportLogAction(log: ReportLogInsert) { return dbCreateReportLog(log); }
export async function updateReportLogAction(id: string, log: ReportLogUpdate) { return dbUpdateReportLog(id, log); }
export async function deleteReportLogAction(id: string) { return dbDeleteReportLog(id); }

export async function getAllNotificationsAction() { return dbGetAllNotifications(); }
export async function createNotificationAction(notification: NotificationInsert) { return dbCreateNotification(notification); }

export async function getAllRolesAction() { return dbGetAllRoles(); }
export async function getAllPermissionsAction() { return dbGetAllPermissions(); }
export async function getAllRolePermissionsAction() { return dbGetAllRolePermissions(); }

export async function rpcUpdateRolePermissionsAction(roleId: number, permissionIds: number[]) {
    return dbRpcUpdateRolePermissions(roleId, permissionIds);
}


export async function getAllTariffsAction() { return dbGetAllTariffs(); }
export async function createTariffAction(tariff: TariffInsert) { return dbCreateTariff(tariff); }
export async function updateTariffAction(customerType: string, year: number, tariff: TariffUpdate) { 
    return await dbUpdateTariff(customerType, year, tariff).select().single();
}
