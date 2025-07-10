

'use server';

import {
  createBranch as supabaseCreateBranch,
  deleteBranch as supabaseDeleteBranch,
  getAllBranches as supabaseGetAllBranches,
  updateBranch as supabaseUpdateBranch,
  createCustomer as supabaseCreateCustomer,
  deleteCustomer as supabaseDeleteCustomer,
  getAllCustomers as supabaseGetAllCustomers,
  updateCustomer as supabaseUpdateCustomer,
  createBulkMeter as supabaseCreateBulkMeter,
  deleteBulkMeter as supabaseDeleteBulkMeter,
  getAllBulkMeters as supabaseGetAllBulkMeters,
  updateBulkMeter as supabaseUpdateBulkMeter,
  createStaffMember as supabaseCreateStaffMember,
  deleteStaffMember as supabaseDeleteStaffMember,
  getAllStaffMembers as supabaseGetAllStaffMembers,
  updateStaffMember as supabaseUpdateStaffMember,
  getStaffMemberForAuth as supabaseGetStaffMemberForAuth,
  createBill as supabaseCreateBill,
  deleteBill as supabaseDeleteBill,
  getAllBills as supabaseGetAllBills,
  updateBill as supabaseUpdateBill,
  createIndividualCustomerReading as supabaseCreateIndividualCustomerReading,
  deleteIndividualCustomerReading as supabaseDeleteIndividualCustomerReading,
  getAllIndividualCustomerReadings as supabaseGetAllIndividualCustomerReadings,
  updateIndividualCustomerReading as supabaseUpdateIndividualCustomerReading,
  createBulkMeterReading as supabaseCreateBulkMeterReading,
  deleteBulkMeterReading as supabaseDeleteBulkMeterReading,
  getAllBulkMeterReadings as supabaseGetAllBulkMeterReadings,
  updateBulkMeterReading as supabaseUpdateBulkMeterReading,
  createPayment as supabaseCreatePayment,
  deletePayment as supabaseDeletePayment,
  getAllPayments as supabaseGetAllPayments,
  updatePayment as supabaseUpdatePayment,
  createReportLog as supabaseCreateReportLog,
  deleteReportLog as supabaseDeleteReportLog,
  getAllReportLogs as supabaseGetAllReportLogs,
  updateReportLog as supabaseUpdateReportLog,
  createNotification as supabaseCreateNotification,
  getAllNotifications as supabaseGetAllNotifications,
  getAllRoles as supabaseGetAllRoles,
  getAllPermissions as supabaseGetAllPermissions,
  getAllRolePermissions as supabaseGetAllRolePermissions,
  rpcUpdateRolePermissions as supabaseRpcUpdateRolePermissions,
  getAllTariffs as supabaseGetAllTariffs,
  updateTariff as supabaseUpdateTariff,
} from './supabase';

import type {
  RoleRow,
  PermissionRow,
  RolePermissionRow,
  Branch,
  BulkMeterRow,
  IndividualCustomer,
  StaffMember,
  Bill,
  IndividualCustomerReading,
  BulkMeterReading,
  Payment,
  ReportLog,
  NotificationRow,
  BranchInsert,
  BranchUpdate,
  BulkMeterInsert,
  BulkMeterUpdate,
  IndividualCustomerInsert,
  IndividualCustomerUpdate,
  StaffMemberInsert,
  StaffMemberUpdate,
  BillInsert,
  BillUpdate,
  IndividualCustomerReadingInsert,
  IndividualCustomerReadingUpdate,
  BulkMeterReadingInsert,
  BulkMeterReadingUpdate,
  PaymentInsert,
  PaymentUpdate,
  ReportLogInsert,
  ReportLogUpdate,
  NotificationInsert,
  TariffRow,
  TariffUpdate
} from './supabase';

export type { RoleRow, PermissionRow, RolePermissionRow, Branch, BulkMeterRow, IndividualCustomer, StaffMember, Bill, IndividualCustomerReading, BulkMeterReading, Payment, ReportLog, NotificationRow, BranchInsert, BranchUpdate, BulkMeterInsert, BulkMeterUpdate, IndividualCustomerInsert, IndividualCustomerUpdate, StaffMemberInsert, StaffMemberUpdate, BillInsert, BillUpdate, IndividualCustomerReadingInsert, IndividualCustomerReadingUpdate, BulkMeterReadingInsert, BulkMeterReadingUpdate, PaymentInsert, PaymentUpdate, ReportLogInsert, ReportLogUpdate, NotificationInsert, TariffRow, TariffUpdate };


export async function getAllBranchesAction() { return supabaseGetAllBranches(); }
export async function createBranchAction(branch: BranchInsert) { return supabaseCreateBranch(branch); }
export async function updateBranchAction(id: string, branch: BranchUpdate) { return supabaseUpdateBranch(id, branch); }
export async function deleteBranchAction(id: string) { return supabaseDeleteBranch(id); }

export async function getAllCustomersAction() { return supabaseGetAllCustomers(); }
export async function createCustomerAction(customer: IndividualCustomerInsert) { return supabaseCreateCustomer(customer); }
export async function updateCustomerAction(customerKeyNumber: string, customer: IndividualCustomerUpdate) { return supabaseUpdateCustomer(customerKeyNumber, customer); }
export async function deleteCustomerAction(customerKeyNumber: string) { return supabaseDeleteCustomer(customerKeyNumber); }

export async function getAllBulkMetersAction() { return supabaseGetAllBulkMeters(); }
export async function createBulkMeterAction(bulkMeter: BulkMeterInsert) { return supabaseCreateBulkMeter(bulkMeter); }
export async function updateBulkMeterAction(customerKeyNumber: string, bulkMeter: BulkMeterUpdate) { return supabaseUpdateBulkMeter(customerKeyNumber, bulkMeter); }
export async function deleteBulkMeterAction(customerKeyNumber: string) { return supabaseDeleteBulkMeter(customerKeyNumber); }

export async function getAllStaffMembersAction() { return supabaseGetAllStaffMembers(); }
export async function createStaffMemberAction(staffMember: StaffMemberInsert) { return supabaseCreateStaffMember(staffMember); }
export async function updateStaffMemberAction(email: string, staffMember: StaffMemberUpdate) { return supabaseUpdateStaffMember(email, staffMember); }
export async function deleteStaffMemberAction(email: string) { return supabaseDeleteStaffMember(email); }
export async function getStaffMemberForAuthAction(email: string, password?: string) { return supabaseGetStaffMemberForAuth(email, password); }

export async function getAllBillsAction() { return supabaseGetAllBills(); }
export async function createBillAction(bill: BillInsert) { return supabaseCreateBill(bill); }
export async function updateBillAction(id: string, bill: BillUpdate) { return supabaseUpdateBill(id, bill); }
export async function deleteBillAction(id: string) { return supabaseDeleteBill(id); }

export async function getAllIndividualCustomerReadingsAction() { return supabaseGetAllIndividualCustomerReadings(); }
export async function createIndividualCustomerReadingAction(reading: IndividualCustomerReadingInsert) { return supabaseCreateIndividualCustomerReading(reading); }
export async function updateIndividualCustomerReadingAction(id: string, reading: IndividualCustomerReadingUpdate) { return supabaseUpdateIndividualCustomerReading(id, reading); }
export async function deleteIndividualCustomerReadingAction(id: string) { return supabaseDeleteIndividualCustomerReading(id); }

export async function getAllBulkMeterReadingsAction() { return supabaseGetAllBulkMeterReadings(); }
export async function createBulkMeterReadingAction(reading: BulkMeterReadingInsert) { return supabaseCreateBulkMeterReading(reading); }
export async function updateBulkMeterReadingAction(id: string, reading: BulkMeterReadingUpdate) { return supabaseUpdateBulkMeterReading(id, reading); }
export async function deleteBulkMeterReadingAction(id: string) { return supabaseDeleteBulkMeterReading(id); }

export async function getAllPaymentsAction() { return supabaseGetAllPayments(); }
export async function createPaymentAction(payment: PaymentInsert) { return supabaseCreatePayment(payment); }
export async function updatePaymentAction(id: string, payment: PaymentUpdate) { return supabaseUpdatePayment(id, payment); }
export async function deletePaymentAction(id: string) { return supabaseDeletePayment(id); }

export async function getAllReportLogsAction() { return supabaseGetAllReportLogs(); }
export async function createReportLogAction(log: ReportLogInsert) { return supabaseCreateReportLog(log); }
export async function updateReportLogAction(id: string, log: ReportLogUpdate) { return supabaseUpdateReportLog(id, log); }
export async function deleteReportLogAction(id: string) { return supabaseDeleteReportLog(id); }

export async function getAllNotificationsAction() { return supabaseGetAllNotifications(); }
export async function createNotificationAction(notification: NotificationInsert) { return supabaseCreateNotification(notification); }

export async function getAllRolesAction() { return supabaseGetAllRoles(); }
export async function getAllPermissionsAction() { return supabaseGetAllPermissions(); }
export async function getAllRolePermissionsAction() { return supabaseGetAllRolePermissions(); }
export async function rpcUpdateRolePermissionsAction(roleId: number, permissionIds: number[]) { return supabaseRpcUpdateRolePermissions(roleId, permissionIds); }

export async function getAllTariffsAction() { return supabaseGetAllTariffs(); }
export async function updateTariffAction(customerType: string, tariff: TariffUpdate) { return supabaseUpdateTariff(customerType, tariff); }
