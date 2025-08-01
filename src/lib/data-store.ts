

"use client";

import type { IndividualCustomer as DomainIndividualCustomer, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter as DomainBulkMeterTypeFromTypes } from '@/app/admin/bulk-meters/bulk-meter-types'; 
import type { Branch as DomainBranch } from '@/app/admin/branches/branch-types';
import type { StaffMember as DomainStaffMember } from '@/app/admin/staff-management/staff-types';
import { calculateBill, type CustomerType, type SewerageConnection, type PaymentStatus, type BillCalculationResult } from '@/lib/billing';
import { supabase } from '@/lib/supabase'; // Direct import of supabase client
import {
  getAllBranchesAction,
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
  getAllCustomersAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  getAllBulkMetersAction,
  createBulkMeterAction,
  updateBulkMeterAction,
  deleteBulkMeterAction,
  getAllStaffMembersAction,
  createStaffMemberAction,
  updateStaffMemberAction,
  deleteStaffMemberAction,
  getStaffMemberForAuthAction,
  getAllBillsAction,
  createBillAction,
  updateBillAction,
  deleteBillAction,
  getAllIndividualCustomerReadingsAction,
  createIndividualCustomerReadingAction,
  updateIndividualCustomerReadingAction,
  deleteIndividualCustomerReadingAction,
  getAllBulkMeterReadingsAction,
  createBulkMeterReadingAction,
  updateBulkMeterReadingAction,
  deleteBulkMeterReadingAction,
  getAllPaymentsAction,
  createPaymentAction,
  updatePaymentAction,
  deletePaymentAction,
  getAllReportLogsAction,
  createReportLogAction,
  updateReportLogAction,
  deleteReportLogAction,
  getAllNotificationsAction,
  createNotificationAction,
  getAllRolesAction,
  getAllPermissionsAction,
  getAllRolePermissionsAction,
  rpcUpdateRolePermissionsAction,
  getAllTariffsAction,
  updateTariffAction,
  createTariffAction,
} from './actions';

import type {
  RoleRow,
  PermissionRow,
  RolePermissionRow,
  Branch,
  BulkMeterRow,
  IndividualCustomer as SupabaseIndividualCustomerRow,
  StaffMember as SupabaseStaffMemberRow,
  Bill as SupabaseBillRow,
  IndividualCustomerReading as SupabaseIndividualCustomerReadingRow,
  BulkMeterReading as SupabaseBulkMeterReadingRow,
  Payment as SupabasePaymentRow,
  ReportLog as SupabaseReportLogRow,
  NotificationRow as SupabaseNotificationRow,
  BranchInsert, BranchUpdate,
  BulkMeterInsert, BulkMeterUpdate,
  IndividualCustomerInsert, IndividualCustomerUpdate,
  StaffMemberInsert, StaffMemberUpdate,
  BillInsert, BillUpdate,
  IndividualCustomerReadingInsert, IndividualCustomerReadingUpdate,
  BulkMeterReadingInsert, BulkMeterReadingUpdate,
  PaymentInsert, PaymentUpdate,
  ReportLogInsert, ReportLogUpdate,
  NotificationInsert,
  TariffRow,
  TariffInsert,
  TariffUpdate,
} from './actions';

export type { RoleRow as DomainRole, PermissionRow as DomainPermission, RolePermissionRow as DomainRolePermission } from './actions';

export interface TariffTier {
  rate: number;
  limit: number | typeof Infinity;
}

export interface TariffInfo {
    id: string;
    customer_type: CustomerType;
    year: number;
    tiers: TariffTier[];
    maintenance_percentage: number;
    sanitation_percentage: number;
    sewerage_rate_per_m3: number;
    meter_rent_prices: { [key: string]: number; };
    vat_rate: number;
    domestic_vat_threshold_m3: number;
}


export interface DomainNotification {
  id: string;
  createdAt: string;
  title: string;
  message: string;
  senderName: string;
  targetBranchId: string | null;
}

export interface DomainBill {
  id: string;
  individualCustomerId?: string | null;
  bulkMeterId?: string | null;
  billPeriodStartDate: string;
  billPeriodEndDate: string;
  monthYear: string;
  previousReadingValue: number;
  currentReadingValue: number;
  usageM3?: number | null;
  differenceUsage?: number | null;
  baseWaterCharge: number;
  sewerageCharge?: number | null;
  maintenanceFee?: number | null;
  sanitationFee?: number | null;
  meterRent?: number | null;
  balanceCarriedForward?: number | null;
  totalAmountDue: number;
  amountPaid?: number;
  balanceDue?: number | null;
  dueDate: string;
  paymentStatus: 'Paid' | 'Unpaid';
  billNumber?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DomainIndividualCustomerReading {
  id: string;
  individualCustomerId: string;
  readerStaffId?: string | null;
  readingDate: string;
  monthYear: string;
  readingValue: number;
  isEstimate?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DomainBulkMeterReading {
  id: string;
  bulkMeterId: string;
  readerStaffId?: string | null;
  readingDate: string;
  monthYear: string;
  readingValue: number;
  isEstimate?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DisplayReading {
    id: string;
    meterId: string | null;
    meterType: 'individual' | 'bulk';
    meterIdentifier: string;
    readingValue: number;
    readingDate: string;
    monthYear: string;
    notes?: string | null;
}

export interface DomainPayment {
  id: string;
  billId?: string | null;
  individualCustomerId?: string | null;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
  transactionReference?: string | null;
  processedByStaffId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DomainReportLog {
  id: string;
  reportName: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
  description?: string | null;
  generatedAt: string;
  generatedByStaffId?: string | null;
  parameters?: any | null;
  fileFormat?: string | null;
  fileName?: string | null;
  status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface StoreOperationResult<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    isNotFoundError?: boolean;
    error?: any;
}

type BulkMeter = DomainBulkMeterTypeFromTypes;
type StaffMember = DomainStaffMember;
type DomainRole = import('./actions').RoleRow;
type DomainPermission = import('./actions').PermissionRow;
type DomainRolePermission = import('./actions').RolePermissionRow;

let branches: DomainBranch[] = [];
let customers: DomainIndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let staffMembers: StaffMember[] = [];
let bills: DomainBill[] = [];
let individualCustomerReadings: DomainIndividualCustomerReading[] = [];
let bulkMeterReadings: DomainBulkMeterReading[] = [];
let payments: DomainPayment[] = [];
let reportLogs: DomainReportLog[] = [];
let notifications: DomainNotification[] = [];
let roles: DomainRole[] = [];
let permissions: DomainPermission[] = [];
let rolePermissions: DomainRolePermission[] = [];
let tariffs: TariffRow[] = [];


let branchesFetched = false;
let customersFetched = false;
let bulkMetersFetched = false;
let staffMembersFetched = false;
let billsFetched = false;
let individualCustomerReadingsFetched = false;
let bulkMeterReadingsFetched = false;
let paymentsFetched = false;
let reportLogsFetched = false;
let notificationsFetched = false;
let rolesFetched = false;
let permissionsFetched = false;
let rolePermissionsFetched = false;
let tariffsFetched = false;


type Listener<T> = (data: T[]) => void;
const branchListeners: Set<Listener<DomainBranch>> = new Set();
const customerListeners: Set<Listener<DomainIndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const staffMemberListeners: Set<Listener<StaffMember>> = new Set();
const billListeners: Set<Listener<DomainBill>> = new Set();
const individualCustomerReadingListeners: Set<Listener<DomainIndividualCustomerReading>> = new Set();
const bulkMeterReadingListeners: Set<Listener<DomainBulkMeterReading>> = new Set();
const paymentListeners: Set<Listener<DomainPayment>> = new Set();
const reportLogListeners: Set<Listener<DomainReportLog>> = new Set();
const notificationListeners: Set<Listener<DomainNotification>> = new Set();
const roleListeners: Set<Listener<DomainRole>> = new Set();
const permissionListeners: Set<Listener<DomainPermission>> = new Set();
const rolePermissionListeners: Set<Listener<DomainRolePermission>> = new Set();
const tariffListeners: Set<Listener<TariffRow>> = new Set();

const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers]));
const notifyBillListeners = () => billListeners.forEach(listener => listener([...bills]));
const notifyIndividualCustomerReadingListeners = () => individualCustomerReadingListeners.forEach(listener => listener([...individualCustomerReadings]));
const notifyBulkMeterReadingListeners = () => bulkMeterReadingListeners.forEach(listener => listener([...bulkMeterReadings]));
const notifyPaymentListeners = () => paymentListeners.forEach(listener => listener([...payments])); 
const notifyReportLogListeners = () => reportLogListeners.forEach(listener => listener([...reportLogs]));
const notifyNotificationListeners = () => notificationListeners.forEach(listener => listener([...notifications]));
const notifyRoleListeners = () => roleListeners.forEach(listener => listener([...roles]));
const notifyPermissionListeners = () => permissionListeners.forEach(listener => listener([...permissions]));
const notifyRolePermissionListeners = () => rolePermissionListeners.forEach(listener => listener([...rolePermissions]));
const notifyTariffListeners = () => tariffListeners.forEach(listener => listener([...tariffs]));


// --- Mappers ---
const mapSupabaseNotificationToDomain = (sn: SupabaseNotificationRow): DomainNotification => ({
  id: sn.id,
  createdAt: sn.created_at,
  title: sn.title,
  message: sn.message,
  senderName: sn.sender_name,
  targetBranchId: sn.target_branch_id,
});

const mapSupabaseBranchToDomain = (sb: Branch): DomainBranch => ({
  id: sb.id,
  name: sb.name,
  location: sb.location,
  contactPerson: sb.contactPerson || undefined,
  contactPhone: sb.contactPhone ? String(sb.contactPhone) : undefined,
  status: sb.status,
});

const parsePhoneNumberForDB = (phoneString?: string): number | null => {
  if (!phoneString) return null;
  const digits = phoneString.replace(/\D/g, '');
  if (digits === '') return null;
  const parsedNumber = parseInt(digits, 10);
  return isNaN(parsedNumber) ? null : parsedNumber;
};

const mapDomainBranchToInsert = (branch: Omit<DomainBranch, 'id'>): BranchInsert => ({
  name: branch.name,
  location: branch.location,
  contactPerson: branch.contactPerson,
  contactPhone: parsePhoneNumberForDB(branch.contactPhone),
  status: branch.status,
});

const mapDomainBranchToUpdate = (branch: Partial<Omit<DomainBranch, 'id'>>): BranchUpdate => {
    const updatePayload: BranchUpdate = {};
    if (branch.name !== undefined) updatePayload.name = branch.name;
    if (branch.location !== undefined) updatePayload.location = branch.location;
    if (branch.contactPerson !== undefined) updatePayload.contactPerson = branch.contactPerson;
    if (branch.contactPhone !== undefined) updatePayload.contactPhone = parsePhoneNumberForDB(branch.contactPhone);
    if (branch.status !== undefined) updatePayload.status = branch.status;
    return updatePayload;
};


const mapSupabaseCustomerToDomain = async (sc: SupabaseIndividualCustomerRow): Promise<DomainIndividualCustomer> => {
  const usage = sc.currentReading - sc.previousReading;
  const { totalBill: bill } = await calculateBill(usage, sc.customerType, sc.sewerageConnection, Number(sc.meterSize), sc.month);
  return {
    customerKeyNumber: sc.customerKeyNumber,
    name: sc.name,
    contractNumber: sc.contractNumber,
    customerType: sc.customerType,
    bookNumber: sc.bookNumber,
    ordinal: Number(sc.ordinal),
    meterSize: Number(sc.meterSize),
    meterNumber: sc.meterNumber,
    previousReading: Number(sc.previousReading),
    currentReading: Number(sc.currentReading),
    month: sc.month,
    specificArea: sc.specificArea,
    subCity: sc.subCity,
    woreda: sc.woreda,
    sewerageConnection: sc.sewerageConnection,
    assignedBulkMeterId: sc.assignedBulkMeterId || undefined,
    branchId: sc.branch_id || undefined,
    status: sc.status,
    paymentStatus: sc.paymentStatus,
    calculatedBill: bill,
    created_at: sc.created_at,
    updated_at: sc.updated_at,
    approved_by: sc.approved_by,
    approved_at: sc.approved_at,
  };
};

const mapDomainCustomerToInsert = async (
  customer: Partial<DomainIndividualCustomer>
): Promise<IndividualCustomerInsert> => {
  const usage = (customer.currentReading || 0) - (customer.previousReading || 0);
  const { totalBill: bill } = await calculateBill(usage, customer.customerType!, customer.sewerageConnection!, Number(customer.meterSize), customer.month!);
  return {
    name: customer.name!,
    customerKeyNumber: customer.customerKeyNumber!,
    contractNumber: customer.contractNumber!,
    customerType: customer.customerType!,
    bookNumber: customer.bookNumber!,
    ordinal: Number(customer.ordinal) || 0,
    meterSize: Number(customer.meterSize) || 0,
    meterNumber: customer.meterNumber!,
    previousReading: Number(customer.previousReading) || 0,
    currentReading: Number(customer.currentReading) || 0,
    month: customer.month!,
    specificArea: customer.specificArea!,
    subCity: customer.subCity!,
    woreda: customer.woreda!,
    sewerageConnection: customer.sewerageConnection!,
    assignedBulkMeterId: customer.assignedBulkMeterId,
    branch_id: customer.branchId, 
    status: customer.status || 'Active', 
    paymentStatus: customer.paymentStatus || 'Unpaid', 
    calculatedBill: bill,
  };
};

const mapDomainCustomerToUpdate = async (customer: Partial<DomainIndividualCustomer>): Promise<IndividualCustomerUpdate> => {
  const updatePayload: IndividualCustomerUpdate = {};

  if(customer.name !== undefined) updatePayload.name = customer.name;
  if(customer.customerKeyNumber !== undefined) updatePayload.customerKeyNumber = customer.customerKeyNumber;
  if(customer.contractNumber !== undefined) updatePayload.contractNumber = customer.contractNumber;
  if(customer.customerType !== undefined) updatePayload.customerType = customer.customerType;
  if(customer.bookNumber !== undefined) updatePayload.bookNumber = customer.bookNumber;
  if(customer.ordinal !== undefined) updatePayload.ordinal = Number(customer.ordinal);
  if(customer.meterSize !== undefined) updatePayload.meterSize = Number(customer.meterSize);
  if(customer.meterNumber !== undefined) updatePayload.meterNumber = customer.meterNumber;
  if(customer.previousReading !== undefined) updatePayload.previousReading = Number(customer.previousReading);
  if(customer.currentReading !== undefined) updatePayload.currentReading = Number(customer.currentReading);
  if(customer.month !== undefined) updatePayload.month = customer.month;
  if(customer.specificArea !== undefined) updatePayload.specificArea = customer.specificArea;
  if(customer.subCity !== undefined) updatePayload.subCity = customer.subCity;
  if(customer.woreda !== undefined) updatePayload.woreda = customer.woreda;
  if(customer.sewerageConnection !== undefined) updatePayload.sewerageConnection = customer.sewerageConnection;
  if(customer.assignedBulkMeterId !== undefined) updatePayload.assignedBulkMeterId = customer.assignedBulkMeterId;
  if(customer.branchId !== undefined) updatePayload.branch_id = customer.branchId; 
  if(customer.status !== undefined) updatePayload.status = customer.status;
  if(customer.paymentStatus !== undefined) updatePayload.paymentStatus = customer.paymentStatus;
  if(customer.approved_by !== undefined) updatePayload.approved_by = customer.approved_by;
  if(customer.approved_at !== undefined) updatePayload.approved_at = customer.approved_at;
  
  if (customer.currentReading !== undefined || customer.previousReading !== undefined || customer.customerType !== undefined || customer.sewerageConnection !== undefined || customer.meterSize !== undefined || customer.month !== undefined) {
    const existingCustomer = customers.find(c => c.customerKeyNumber === customer.customerKeyNumber);
    if (existingCustomer) {
        const usage = (customer.currentReading ?? existingCustomer.currentReading) - (customer.previousReading ?? existingCustomer.previousReading);
        const { totalBill } = await calculateBill(
            usage,
            customer.customerType ?? existingCustomer.customerType,
            customer.sewerageConnection ?? existingCustomer.sewerageConnection,
            Number(customer.meterSize ?? existingCustomer.meterSize),
            customer.month ?? existingCustomer.month
        );
        updatePayload.calculatedBill = totalBill;
    }
  }
  return updatePayload;
};


const mapSupabaseBulkMeterToDomain = async (sbm: BulkMeterRow): Promise<BulkMeter> => {
  const calculatedBmUsage = (sbm.currentReading ?? 0) - (sbm.previousReading ?? 0);
  const bmUsage = sbm.bulk_usage === null || sbm.bulk_usage === undefined
                  ? calculatedBmUsage
                  : Number(sbm.bulk_usage);

  const { totalBill: calculatedBmTotalBill } = await calculateBill(bmUsage, sbm.charge_group || 'Non-domestic', sbm.sewerage_connection || 'No', Number(sbm.meterSize), sbm.month);
  const bmTotalBill = sbm.total_bulk_bill === null || sbm.total_bulk_bill === undefined
                      ? calculatedBmTotalBill
                      : Number(sbm.total_bulk_bill);
  return {
    customerKeyNumber: sbm.customerKeyNumber,
    name: sbm.name,
    contractNumber: sbm.contractNumber,
    meterSize: Number(sbm.meterSize),
    meterNumber: sbm.meterNumber,
    previousReading: Number(sbm.previousReading),
    currentReading: Number(sbm.currentReading),
    month: sbm.month,
    specificArea: sbm.specificArea,
    subCity: sbm.subCity,
    woreda: sbm.woreda,
    branchId: sbm.branch_id || undefined, 
    status: sbm.status,
    paymentStatus: sbm.paymentStatus,
    chargeGroup: sbm.charge_group,
    sewerageConnection: sbm.sewerage_connection,
    bulkUsage: bmUsage,
    totalBulkBill: bmTotalBill,
    differenceUsage: sbm.difference_usage === null || sbm.difference_usage === undefined ? undefined : Number(sbm.difference_usage),
    differenceBill: sbm.difference_bill === null || sbm.difference_bill === undefined ? undefined : Number(sbm.difference_bill),
    outStandingbill: sbm.outStandingbill ? Number(sbm.outStandingbill) : 0, 
    xCoordinate: sbm.x_coordinate ? Number(sbm.x_coordinate) : undefined,
    yCoordinate: sbm.y_coordinate ? Number(sbm.y_coordinate) : undefined,
    approved_by: sbm.approved_by,
    approved_at: sbm.approved_at,
  };
};


const mapDomainBulkMeterToInsert = async (bm: Partial<BulkMeter>): Promise<BulkMeterInsert> => {
  const calculatedBulkUsage = (bm.currentReading ?? 0) - (bm.previousReading ?? 0);
  const { totalBill: calculatedTotalBulkBill } = await calculateBill(calculatedBulkUsage, "Non-domestic", "No", Number(bm.meterSize), bm.month!);

  const allIndividualCustomers = getCustomers();
  const associatedCustomers = allIndividualCustomers.filter(c => c.assignedBulkMeterId === bm.customerKeyNumber);
  const sumIndividualUsage = associatedCustomers.reduce((acc, cust) => acc + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);

  const differenceUsage = calculatedBulkUsage - sumIndividualUsage;
  const { totalBill: differenceBill } = await calculateBill(differenceUsage, "Non-domestic", "No", Number(bm.meterSize), bm.month!);

  return {
    name: bm.name!,
    customerKeyNumber: bm.customerKeyNumber!,
    contractNumber: bm.contractNumber!,
    meterSize: Number(bm.meterSize) || 0,
    meterNumber: bm.meterNumber!,
    previousReading: Number(bm.previousReading) || 0,
    currentReading: Number(bm.currentReading) || 0,
    month: bm.month!,
    specificArea: bm.specificArea!,
    subCity: bm.subCity!,
    woreda: bm.woreda!,
    branch_id: bm.branchId, 
    status: bm.status || 'Active',
    paymentStatus: bm.paymentStatus || 'Unpaid',
    charge_group: bm.chargeGroup || 'Non-domestic',
    sewerage_connection: bm.sewerageConnection || 'No',
    bulk_usage: calculatedBulkUsage,
    total_bulk_bill: calculatedTotalBulkBill,
    difference_usage: differenceUsage,
    difference_bill: differenceBill,
    outStandingbill: bm.outStandingbill ? Number(bm.outStandingbill) : 0, 
    x_coordinate: bm.xCoordinate,
    y_coordinate: bm.yCoordinate,
  };
};


const mapDomainBulkMeterToUpdate = async (bm: Partial<BulkMeter> & { customerKeyNumber?: string } ): Promise<BulkMeterUpdate> => {
    const updatePayload: BulkMeterUpdate = {};
    if (bm.name !== undefined) updatePayload.name = bm.name;
    if (bm.customerKeyNumber !== undefined) updatePayload.customerKeyNumber = bm.customerKeyNumber;
    if (bm.contractNumber !== undefined) updatePayload.contractNumber = bm.contractNumber;
    if (bm.meterSize !== undefined) updatePayload.meterSize = Number(bm.meterSize);
    if (bm.meterNumber !== undefined) updatePayload.meterNumber = bm.meterNumber;
    if (bm.previousReading !== undefined) updatePayload.previousReading = Number(bm.previousReading);
    if (bm.currentReading !== undefined) updatePayload.currentReading = Number(bm.currentReading);
    if (bm.month !== undefined) updatePayload.month = bm.month;
    if (bm.specificArea !== undefined) updatePayload.specificArea = bm.specificArea;
    if (bm.subCity !== undefined) updatePayload.subCity = bm.subCity;
    if (bm.woreda !== undefined) updatePayload.woreda = bm.woreda;
    if (bm.branchId !== undefined) updatePayload.branch_id = bm.branchId; 
    if (bm.status !== undefined) updatePayload.status = bm.status;
    if (bm.paymentStatus !== undefined) updatePayload.paymentStatus = bm.paymentStatus;
    if (bm.chargeGroup !== undefined) updatePayload.charge_group = bm.chargeGroup;
    if (bm.sewerageConnection !== undefined) updatePayload.sewerage_connection = bm.sewerageConnection;
    if (bm.outStandingbill !== undefined) updatePayload.outStandingbill = Number(bm.outStandingbill);
    if (bm.xCoordinate !== undefined) updatePayload.x_coordinate = bm.xCoordinate;
    if (bm.yCoordinate !== undefined) updatePayload.y_coordinate = bm.yCoordinate;
    if (bm.approved_by !== undefined) updatePayload.approved_by = bm.approved_by;
    if (bm.approved_at !== undefined) updatePayload.approved_at = bm.approved_at;

    if (bm.customerKeyNumber && (bm.currentReading !== undefined || bm.previousReading !== undefined || bm.meterSize !== undefined || bm.month !== undefined)) {
        const existingBM = bulkMeters.find(b => b.customerKeyNumber === bm.customerKeyNumber);
        const currentReading = bm.currentReading ?? existingBM?.currentReading ?? 0;
        const previousReading = bm.previousReading ?? existingBM?.previousReading ?? 0;
        const meterSize = bm.meterSize ?? existingBM?.meterSize ?? 0;
        const billingMonth = bm.month ?? existingBM?.month ?? new Date().toISOString().slice(0, 7);
        const chargeGroup = bm.chargeGroup ?? existingBM?.chargeGroup ?? 'Non-domestic';
        const sewerageConnection = bm.sewerageConnection ?? existingBM?.sewerageConnection ?? 'No';

        
        const newBulkUsage = currentReading - previousReading;
        const { totalBill: newTotalBulkBill } = await calculateBill(newBulkUsage, chargeGroup, sewerageConnection, Number(meterSize), billingMonth);

        updatePayload.bulk_usage = newBulkUsage;
        updatePayload.total_bulk_bill = newTotalBulkBill;

        const allIndividualCustomers = getCustomers(); 
        const associatedCustomers = allIndividualCustomers.filter(c => c.assignedBulkMeterId === bm.customerKeyNumber);
        
        const sumIndividualUsage = associatedCustomers.reduce((acc, cust) => {
            const usage = (cust.currentReading ?? 0) - (cust.previousReading ?? 0);
            return acc + usage;
        }, 0);
        
        const newDifferenceUsage = newBulkUsage - sumIndividualUsage;
        updatePayload.difference_usage = newDifferenceUsage;
        
        const { totalBill: newDifferenceBill } = await calculateBill(newDifferenceUsage, chargeGroup, sewerageConnection, Number(meterSize), billingMonth);
        updatePayload.difference_bill = newDifferenceBill;
    }
    return updatePayload;
};


const mapSupabaseStaffToDomain = (ss: SupabaseStaffMemberRow & { roles?: { role_name: string } | null; role_name?: string }): StaffMember => ({
  id: ss.id,
  name: ss.name,
  email: ss.email,
  password: ss.password || undefined,
  branchName: ss.branch,
  status: ss.status,
  phone: ss.phone || undefined,
  hireDate: ss.hire_date || undefined,
  role: ss.role_name || ss.roles?.role_name || ss.role, // Handle direct role_name from auth query
  roleId: ss.role_id || undefined,
});

const mapDomainStaffToInsert = (staff: StaffMember): StaffMemberInsert => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  password: staff.password,
  branch: staff.branchName,
  status: staff.status,
  phone: staff.phone,
  hire_date: staff.hireDate,
  role: staff.role,
  role_id: staff.roleId,
});

const mapDomainStaffToUpdate = (staff: Partial<Omit<StaffMember, 'id' | 'email'>>): Omit<StaffMemberUpdate, 'email'> => {
    const updatePayload: Omit<StaffMemberUpdate, 'email'> = {};
    if(staff.name !== undefined) updatePayload.name = staff.name;
    if(staff.branchName !== undefined) updatePayload.branch = staff.branchName;
    if(staff.status !== undefined) updatePayload.status = staff.status;
    if(staff.phone !== undefined) updatePayload.phone = staff.phone;
    if(staff.hireDate !== undefined) updatePayload.hire_date = staff.hireDate;
    if(staff.role !== undefined) updatePayload.role = staff.role;
    if(staff.roleId !== undefined) updatePayload.role_id = staff.roleId;
    if(staff.password !== undefined && staff.password) {
        updatePayload.password = staff.password;
    } else {
        delete updatePayload.password;
    }
    return updatePayload;
};


const mapSupabaseBillToDomain = (sb: SupabaseBillRow): DomainBill => ({
  id: sb.id,
  individualCustomerId: sb.individual_customer_id,
  bulkMeterId: sb.bulk_meter_id,
  billPeriodStartDate: sb.bill_period_start_date,
  billPeriodEndDate: sb.bill_period_end_date,
  monthYear: sb.month_year,
  previousReadingValue: Number(sb.previous_reading_value),
  currentReadingValue: Number(sb.current_reading_value),
  usageM3: sb.usage_m3 ? Number(sb.usage_m3) : null,
  differenceUsage: sb.difference_usage ? Number(sb.difference_usage) : null,
  baseWaterCharge: Number(sb.base_water_charge),
  sewerageCharge: sb.sewerage_charge ? Number(sb.sewerage_charge) : null,
  maintenanceFee: sb.maintenance_fee ? Number(sb.maintenance_fee) : null,
  sanitationFee: sb.sanitation_fee ? Number(sb.sanitation_fee) : null,
  meterRent: sb.meter_rent ? Number(sb.meter_rent) : null,
  balanceCarriedForward: sb.balance_carried_forward ? Number(sb.balance_carried_forward) : null,
  totalAmountDue: Number(sb.total_amount_due),
  amountPaid: sb.amount_paid ? Number(sb.amount_paid) : undefined,
  balanceDue: sb.balance_due ? Number(sb.balance_due) : null,
  dueDate: sb.due_date,
  paymentStatus: sb.payment_status,
  billNumber: sb.bill_number,
  notes: sb.notes,
  createdAt: sb.created_at,
  updatedAt: sb.updated_at,
});

const mapDomainBillToSupabase = (bill: Partial<DomainBill>): Partial<BillInsert | BillUpdate> => {
    const payload: Partial<BillInsert | BillUpdate> = {};
    if (bill.individualCustomerId !== undefined) payload.individual_customer_id = bill.individualCustomerId;
    if (bill.bulkMeterId !== undefined) payload.bulk_meter_id = bill.bulkMeterId;
    if (bill.billPeriodStartDate !== undefined) payload.bill_period_start_date = bill.billPeriodStartDate;
    if (bill.billPeriodEndDate !== undefined) payload.bill_period_end_date = bill.billPeriodEndDate;
    if (bill.monthYear !== undefined) payload.month_year = bill.monthYear;
    if (bill.previousReadingValue !== undefined) payload.previous_reading_value = bill.previousReadingValue;
    if (bill.currentReadingValue !== undefined) payload.current_reading_value = bill.currentReadingValue;
    if (bill.usageM3 !== undefined) payload.usage_m3 = bill.usageM3;
    if (bill.differenceUsage !== undefined) payload.difference_usage = bill.differenceUsage;
    if (bill.baseWaterCharge !== undefined) payload.base_water_charge = bill.baseWaterCharge;
    if (bill.sewerageCharge !== undefined) payload.sewerage_charge = bill.sewerageCharge;
    if (bill.maintenanceFee !== undefined) payload.maintenance_fee = bill.maintenanceFee;
    if (bill.sanitationFee !== undefined) payload.sanitation_fee = bill.sanitationFee;
    if (bill.meterRent !== undefined) payload.meter_rent = bill.meterRent;
    if (bill.balanceCarriedForward !== undefined) payload.balance_carried_forward = bill.balanceCarriedForward;
    if (bill.totalAmountDue !== undefined) payload.total_amount_due = bill.totalAmountDue;
    if (bill.amountPaid !== undefined) payload.amount_paid = bill.amountPaid;
    if (bill.dueDate !== undefined) payload.due_date = bill.dueDate;
    if (bill.paymentStatus !== undefined) payload.payment_status = bill.paymentStatus;
    if (bill.billNumber !== undefined) payload.bill_number = bill.billNumber;
    if (bill.notes !== undefined) payload.notes = bill.notes;
    return payload;
};

const mapSupabaseIndividualReadingToDomain = (smr: SupabaseIndividualCustomerReadingRow): DomainIndividualCustomerReading => ({
  id: smr.id,
  individualCustomerId: smr.individual_customer_id,
  readerStaffId: smr.reader_staff_id,
  readingDate: smr.reading_date,
  monthYear: smr.month_year,
  readingValue: Number(smr.reading_value),
  isEstimate: smr.is_estimate,
  notes: smr.notes,
  createdAt: smr.created_at,
  updatedAt: smr.updated_at,
});

const mapDomainIndividualReadingToSupabase = (mr: Partial<DomainIndividualCustomerReading>): Partial<IndividualCustomerReadingInsert | IndividualCustomerReadingUpdate> => {
    const payload: Partial<IndividualCustomerReadingInsert | IndividualCustomerReadingUpdate> = {};
    if (mr.individualCustomerId !== undefined) payload.individual_customer_id = mr.individualCustomerId;
    if (mr.readerStaffId !== undefined) payload.reader_staff_id = mr.readerStaffId;
    if (mr.readingDate !== undefined) payload.reading_date = mr.readingDate;
    if (mr.monthYear !== undefined) payload.month_year = mr.monthYear;
    if (mr.readingValue !== undefined) payload.reading_value = mr.readingValue;
    if (mr.isEstimate !== undefined) payload.is_estimate = mr.isEstimate;
    if (mr.notes !== undefined) payload.notes = mr.notes;
    return payload;
};

const mapSupabaseBulkReadingToDomain = (smr: SupabaseBulkMeterReadingRow): DomainBulkMeterReading => ({
  id: smr.id,
  bulkMeterId: smr.bulk_meter_id,
  readerStaffId: smr.reader_staff_id,
  readingDate: smr.reading_date,
  monthYear: smr.month_year,
  readingValue: Number(smr.reading_value),
  isEstimate: smr.is_estimate,
  notes: smr.notes,
  createdAt: smr.created_at,
  updatedAt: smr.updated_at,
});

const mapDomainBulkReadingToSupabase = (mr: Partial<DomainBulkMeterReading>): Partial<BulkMeterReadingInsert | BulkMeterReadingUpdate> => {
    const payload: Partial<BulkMeterReadingInsert | BulkMeterReadingUpdate> = {};
    if (mr.bulkMeterId !== undefined) payload.bulk_meter_id = mr.bulkMeterId;
    if (mr.readerStaffId !== undefined) payload.reader_staff_id = mr.readerStaffId;
    if (mr.readingDate !== undefined) payload.reading_date = mr.readingDate;
    if (mr.monthYear !== undefined) payload.month_year = mr.monthYear;
    if (mr.readingValue !== undefined) payload.reading_value = mr.readingValue;
    if (mr.isEstimate !== undefined) payload.is_estimate = mr.isEstimate;
    if (mr.notes !== undefined) payload.notes = mr.notes;
    return payload;
};

const mapSupabasePaymentToDomain = (sp: SupabasePaymentRow): DomainPayment => ({
  id: sp.id,
  billId: sp.bill_id,
  individualCustomerId: sp.individual_customer_id,
  paymentDate: sp.payment_date,
  amountPaid: Number(sp.amount_paid),
  paymentMethod: sp.payment_method,
  transactionReference: sp.transaction_reference,
  processedByStaffId: sp.processed_by_staff_id,
  notes: sp.notes,
  createdAt: sp.created_at,
  updatedAt: sp.updated_at,
});

const mapDomainPaymentToSupabase = (p: Partial<DomainPayment>): Partial<PaymentInsert | PaymentUpdate> => {
    const payload: Partial<PaymentInsert | PaymentUpdate> = {};
    if (p.billId !== undefined) payload.bill_id = p.billId;
    if (p.individualCustomerId !== undefined) payload.individual_customer_id = p.individualCustomerId;
    if (p.paymentDate !== undefined) payload.payment_date = p.paymentDate;
    if (p.amountPaid !== undefined) payload.amount_paid = p.amountPaid;
    if (p.paymentMethod !== undefined) payload.payment_method = p.paymentMethod;
    if (p.transactionReference !== undefined) payload.transaction_reference = p.transactionReference;
    if (p.processedByStaffId !== undefined) payload.processed_by_staff_id = p.processedByStaffId;
    if (p.notes !== undefined) payload.notes = p.notes;
    return payload;
};

const mapSupabaseReportLogToDomain = (srl: SupabaseReportLogRow): DomainReportLog => ({
  id: srl.id,
  reportName: srl.report_name,
  description: srl.description,
  generatedAt: srl.generated_at,
  generatedByStaffId: srl.generated_by_staff_id,
  parameters: srl.parameters,
  fileFormat: srl.file_format,
  fileName: srl.file_name,
  status: srl.status,
  createdAt: srl.created_at,
  updatedAt: srl.updated_at,
});

const mapDomainReportLogToSupabase = (rl: Partial<DomainReportLog>): Partial<ReportLogInsert | ReportLogUpdate> => {
    const payload: Partial<ReportLogInsert | ReportLogUpdate> = {};
    if (rl.reportName !== undefined) payload.report_name = rl.reportName;
    if (rl.description !== undefined) payload.description = rl.description;
    if (rl.generatedByStaffId !== undefined) payload.generated_by_staff_id = rl.generatedByStaffId;
    if (rl.parameters !== undefined) payload.parameters = rl.parameters;
    if (rl.fileFormat !== undefined) payload.file_format = rl.fileFormat;
    if (rl.fileName !== undefined) payload.file_name = rl.fileName;
    if (rl.status !== undefined) payload.status = rl.status;
    return payload;
};

async function fetchAllTariffs() {
    const { data, error } = await getAllTariffsAction();
    if (data) {
        tariffs = data;
        notifyTariffListeners();
    } else {
        console.error("DataStore: Failed to fetch tariffs. Supabase error:", JSON.stringify(error, null, 2));
    }
    tariffsFetched = true;
    return tariffs;
}


async function fetchAllBranches() {
  const { data, error } = await getAllBranchesAction();
  if (data) {
    branches = data.map(mapSupabaseBranchToDomain);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to fetch branches. Supabase error:", JSON.stringify(error, null, 2));
  }
  branchesFetched = true;
  return branches;
}

async function fetchAllCustomers() {
  const { data, error } = await getAllCustomersAction();
  if (data) {
    customers = await Promise.all(data.map(mapSupabaseCustomerToDomain));
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to fetch customers. Supabase error:", JSON.stringify(error, null, 2));
  }
  customersFetched = true;
  return customers;
}

async function fetchAllBulkMeters() {
  const { data: rawBulkMeters, error: fetchError } = await getAllBulkMetersAction();

  if (fetchError) {
    console.error("DataStore: Failed to fetch bulk meters. Supabase error:", JSON.stringify(fetchError, null, 2));
    bulkMetersFetched = true;
    return [];
  }

  if (!rawBulkMeters) {
    bulkMeters = [];
    notifyBulkMeterListeners();
    bulkMetersFetched = true;
    return [];
  }

  let processedBulkMeters = rawBulkMeters;
  
  if (!customersFetched) { 
    await initializeCustomers();
  }
  
  const updatedRowsFromBackfill: BulkMeterRow[] = [];
  let backfillPerformed = false;

  for (const sbm of rawBulkMeters) {
    if (
      sbm.bulk_usage === null ||
      sbm.total_bulk_bill === null ||
      sbm.difference_usage === null ||
      sbm.difference_bill === null
    ) {
      backfillPerformed = true;
      const currentReading = Number(sbm.currentReading) || 0;
      const previousReading = Number(sbm.previousReading) || 0;

      const calculatedBulkUsage = currentReading - previousReading;
      const { totalBill: calculatedTotalBulkBill } = await calculateBill(calculatedBulkUsage, "Non-domestic", "No", Number(sbm.meterSize), sbm.month);

      const associatedCustomersData = getCustomers().filter(c => c.assignedBulkMeterId === sbm.customerKeyNumber);
      const sumIndividualUsage = associatedCustomersData.reduce((acc, cust) => acc + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);
      
      const calculatedDifferenceUsage = calculatedBulkUsage - sumIndividualUsage;
      const { totalBill: calculatedDifferenceBill } = await calculateBill(calculatedDifferenceUsage, "Non-domestic", "No", Number(sbm.meterSize), sbm.month);


      const updatePayload: BulkMeterUpdate = {
        bulk_usage: calculatedBulkUsage,
        total_bulk_bill: calculatedTotalBulkBill,
        difference_usage: calculatedDifferenceUsage,
        difference_bill: calculatedDifferenceBill,
      };

      const { data: updatedRow, error: updateError } = await updateBulkMeterAction(sbm.customerKeyNumber, updatePayload);
      if (updateError) {
        console.error(`DataStore: Failed to backfill bulk meter ${sbm.customerKeyNumber}. Error:`, JSON.stringify(updateError, null, 2));
        updatedRowsFromBackfill.push(sbm); 
      } else if (updatedRow) {
        updatedRowsFromBackfill.push(updatedRow); 
      } else {
        updatedRowsFromBackfill.push(sbm);
      }
    } else {
      updatedRowsFromBackfill.push(sbm); 
    }
  }
  if (backfillPerformed) {
      processedBulkMeters = updatedRowsFromBackfill; 
  }
  
  bulkMeters = await Promise.all(processedBulkMeters.map(mapSupabaseBulkMeterToDomain));
  notifyBulkMeterListeners();
  bulkMetersFetched = true;
  return bulkMeters;
}


async function fetchAllStaffMembers() {
  const { data, error } = await getAllStaffMembersAction();
  if (data) {
    staffMembers = data.map(mapSupabaseStaffToDomain);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to fetch staff members. Supabase error:", JSON.stringify(error, null, 2));
  }
  staffMembersFetched = true;
  return staffMembers;
}

async function fetchAllBills() {
    const { data, error } = await getAllBillsAction();
    if (data) {
        bills = data.map(mapSupabaseBillToDomain);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to fetch bills. Supabase error:", JSON.stringify(error, null, 2));
    }
    billsFetched = true;
    return bills;
}

async function fetchAllIndividualCustomerReadings() {
    const { data, error } = await getAllIndividualCustomerReadingsAction();
    if (data) {
        individualCustomerReadings = data.map(mapSupabaseIndividualReadingToDomain);
        notifyIndividualCustomerReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch individual customer readings. Supabase error:", JSON.stringify(error, null, 2));
    }
    individualCustomerReadingsFetched = true;
    return individualCustomerReadings;
}

async function fetchAllBulkMeterReadings() {
    const { data, error } = await getAllBulkMeterReadingsAction();
    if (data) {
        bulkMeterReadings = data.map(mapSupabaseBulkReadingToDomain);
        notifyBulkMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch bulk meter readings. Supabase error:", JSON.stringify(error, null, 2));
    }
    bulkMeterReadingsFetched = true;
    return bulkMeterReadings;
}

async function fetchAllPayments() {
    const { data, error } = await getAllPaymentsAction();
    if (data) {
        payments = data.map(mapSupabasePaymentToDomain);
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to fetch payments. Supabase error:", JSON.stringify(error, null, 2));
    }
    paymentsFetched = true;
    return payments;
}

async function fetchAllReportLogs() {
    const { data, error } = await getAllReportLogsAction();
    if (data) {
        reportLogs = data.map(mapSupabaseReportLogToDomain);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to fetch report logs. Supabase error:", JSON.stringify(error, null, 2));
    }
    reportLogsFetched = true;
    return reportLogs;
}

async function fetchAllNotifications() {
  const { data, error } = await getAllNotificationsAction();
  if (data) {
    notifications = data.map(mapSupabaseNotificationToDomain);
    notifyNotificationListeners();
  } else {
    console.error("DataStore: Failed to fetch notifications. Supabase error:", JSON.stringify(error, null, 2));
  }
  notificationsFetched = true;
  return notifications;
}

async function fetchAllRoles() {
  const { data, error } = await getAllRolesAction();
  if (data) {
    roles = data;
    notifyRoleListeners();
  } else {
    console.error("DataStore: Failed to fetch roles. Supabase error:", JSON.stringify(error, null, 2));
  }
  rolesFetched = true;
  return roles;
}

async function fetchAllPermissions() {
  const { data, error } = await getAllPermissionsAction();
  if (data) {
    permissions = data;
    notifyPermissionListeners();
  } else {
    console.error("DataStore: Failed to fetch permissions. Supabase error:", JSON.stringify(error, null, 2));
  }
  permissionsFetched = true;
  return permissions;
}

async function fetchAllRolePermissions() {
  const { data, error } = await getAllRolePermissionsAction();
  if (data) {
    rolePermissions = data;
    notifyRolePermissionListeners();
  } else {
    console.error("DataStore: Failed to fetch role permissions. Supabase error:", JSON.stringify(error, null, 2));
  }
  rolePermissionsFetched = true;
  return rolePermissions;
}

export const initializeBranches = async () => {
  if (!branchesFetched || branches.length === 0) {
    await fetchAllBranches();
  }
};

export const initializeCustomers = async () => {
  if (!customersFetched || customers.length === 0) {
    await fetchAllCustomers();
  }
};

export const initializeBulkMeters = async () => {
  if (!bulkMetersFetched || bulkMeters.length === 0) { 
    await fetchAllBulkMeters();
  }
};

export const initializeStaffMembers = async () => {
  if (!staffMembersFetched || staffMembers.length === 0) {
    await fetchAllStaffMembers();
  }
};

export const initializeBills = async () => {
    if (!billsFetched || bills.length === 0) await fetchAllBills();
};
export const initializeIndividualCustomerReadings = async () => {
    if (!individualCustomerReadingsFetched || individualCustomerReadings.length === 0) await fetchAllIndividualCustomerReadings();
};
export const initializeBulkMeterReadings = async () => {
    if (!bulkMeterReadingsFetched || bulkMeterReadings.length === 0) await fetchAllBulkMeterReadings();
};
export const initializePayments = async () => {
    if (!paymentsFetched || payments.length === 0) await fetchAllPayments();
};
export const initializeReportLogs = async () => {
    if (!reportLogsFetched || reportLogs.length === 0) await fetchAllReportLogs();
};

export const initializeNotifications = async () => {
  if (!notificationsFetched) {
    await fetchAllNotifications();
  }
};

export const initializeRoles = async () => {
  if (!rolesFetched) {
    await fetchAllRoles();
  }
};

export const initializePermissions = async () => {
  if (!permissionsFetched) {
    await fetchAllPermissions();
  }
};

export const initializeRolePermissions = async () => {
  if (!rolePermissionsFetched) {
    await fetchAllRolePermissions();
  }
};

export const initializeTariffs = async () => {
    if (!tariffsFetched) {
        await fetchAllTariffs();
    }
    return tariffs;
};

export const getTariff = (customerType: CustomerType, year: number): TariffInfo | undefined => {
    if (tariffs.length === 0) {
        console.error("DataStore: getTariff called but tariffs array is empty.");
        return undefined;
    }
    const tariff = tariffs.find(t => t.customer_type === customerType && t.year === year);
    if (!tariff) {
        console.warn(`Tariff for customer type "${customerType}" and year "${year}" not found in local store.`);
        return undefined;
    }
    
    let parsedTiers;
    if (typeof tariff.tiers === 'string') {
        try { parsedTiers = JSON.parse(tariff.tiers); } catch (e) {
            console.error(`Failed to parse tiers JSON for tariff ${customerType}/${year}`, e);
            parsedTiers = [];
        }
    } else {
        parsedTiers = tariff.tiers;
    }
    
    let parsedMeterRents;
    if (typeof tariff.meter_rent_prices === 'string') {
        try { parsedMeterRents = JSON.parse(tariff.meter_rent_prices); } catch(e) {
            console.error(`Failed to parse meter_rent_prices JSON from DB for tariff ${customerType}/${year}`, e);
            parsedMeterRents = {};
        }
    } else {
        parsedMeterRents = tariff.meter_rent_prices || {};
    }

    return {
        id: `${customerType}-${year}`,
        customer_type: tariff.customer_type as CustomerType,
        year: tariff.year,
        tiers: parsedTiers,
        maintenance_percentage: tariff.maintenance_percentage,
        sanitation_percentage: tariff.sanitation_percentage,
        sewerage_rate_per_m3: tariff.sewerage_rate_per_m3,
        meter_rent_prices: parsedMeterRents,
        vat_rate: tariff.vat_rate,
        domestic_vat_threshold_m3: tariff.domestic_vat_threshold_m3,
    };
};



export const getBranches = (): DomainBranch[] => [...branches];
export const getCustomers = (): DomainIndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getStaffMembers = (): StaffMember[] => [...staffMembers];
export const getBills = (): DomainBill[] => [...bills];
export const getIndividualCustomerReadings = (): DomainIndividualCustomerReading[] => [...individualCustomerReadings];
export const getBulkMeterReadings = (): DomainBulkMeterReading[] => [...bulkMeterReadings];
export const getNotifications = (): DomainNotification[] => [...notifications];
export const getRoles = (): DomainRole[] => [...roles];
export const getPermissions = (): DomainPermission[] => [...permissions];
export const getRolePermissions = (): DomainRolePermission[] => [...rolePermissions];

export function getMeterReadings(): (DomainIndividualCustomerReading | DomainBulkMeterReading)[] {
    const allReadings = [
        ...individualCustomerReadings.map(r => ({ ...r, meterType: 'individual_customer_meter' })),
        ...bulkMeterReadings.map(r => ({ ...r, meterType: 'bulk_meter' }))
    ];
    return allReadings.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
}

export const getPayments = (): DomainPayment[] => [...payments];
export const getReportLogs = (): DomainReportLog[] => [...reportLogs];

export const getBulkMeterPaymentStatusCounts = (): { totalBMs: number; paidBMs: number; unpaidBMs: number } => {
  const totalBMs = bulkMeters.length;
  const paidBMs = bulkMeters.filter(bm => bm.paymentStatus === 'Paid').length;
  const unpaidBMs = totalBMs - paidBMs;
  return { totalBMs, paidBMs, unpaidBMs };
};

export const addBranch = async (branchData: Omit<DomainBranch, 'id'>): Promise<StoreOperationResult<DomainBranch>> => {
  const payload = mapDomainBranchToInsert(branchData);
  const { data: newSupabaseBranch, error } = await createBranchAction(payload);
  if (newSupabaseBranch && !error) {
    const newBranch = mapSupabaseBranchToDomain(newSupabaseBranch);
    branches = [newBranch, ...branches];
    notifyBranchListeners();
    return { success: true, data: newBranch };
  }
  console.error("DataStore: Failed to add branch. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: error?.message || "Failed to add branch.", error };
};

export const updateBranch = async (id: string, branchData: Partial<Omit<DomainBranch, 'id'>>): Promise<StoreOperationResult<void>> => {
  const updatePayload = mapDomainBranchToUpdate(branchData);
  const { data: updatedSupabaseBranch, error } = await updateBranchAction(id, updatePayload);
  if (updatedSupabaseBranch && !error) {
    const updatedBranch = mapSupabaseBranchToDomain(updatedSupabaseBranch);
    branches = branches.map(b => b.id === id ? updatedBranch : b);
    notifyBranchListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to update branch. Error:", JSON.stringify(error, null, 2));
  let userMessage = "Failed to update branch.";
  let isNotFoundError = false;
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
    userMessage = "Failed to update branch: Record not found.";
    isNotFoundError = true;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    userMessage = `Failed to update branch: ${error.message}`;
  }
  return { success: false, message: userMessage, isNotFoundError, error };
};

export const deleteBranch = async (branchId: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteBranchAction(branchId);
  if (!error) {
    branches = branches.filter(b => b.id !== branchId);
    notifyBranchListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete branch. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete branch.", error };
};

export const addCustomer = async (
  customerData: Partial<DomainIndividualCustomer>,
  currentUser: StaffMember
): Promise<StoreOperationResult<DomainIndividualCustomer>> => {
  let finalStatus: IndividualCustomerStatus = 'Active'; // Default for admins
  const userRole = currentUser?.role?.toLowerCase();

  // Set status to 'Pending Approval' if the creator is a 'Staff' member
  if (userRole === 'staff' || userRole === 'staff management') {
    finalStatus = 'Pending Approval';
  }

  const customerDataWithStatus = { ...customerData, status: finalStatus };
  const customerPayload = await mapDomainCustomerToInsert(customerDataWithStatus);

  const { data: newSupabaseCustomer, error } = await createCustomerAction(customerPayload);

  if (newSupabaseCustomer && !error) {
    const newCustomer = await mapSupabaseCustomerToDomain(newSupabaseCustomer);
    customers = [newCustomer, ...customers];
    notifyCustomerListeners();
    return { success: true, data: newCustomer };
  }
  console.error("DataStore: Failed to add customer. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to add customer.", error };
};


export const updateCustomer = async (customerKeyNumber: string, customerData: Partial<Omit<DomainIndividualCustomer, 'customerKeyNumber'>>): Promise<StoreOperationResult<void>> => {
  const updatePayloadSupabase = await mapDomainCustomerToUpdate({ customerKeyNumber, ...customerData });
  const { data: updatedSupabaseCustomer, error } = await updateCustomerAction(customerKeyNumber, updatePayloadSupabase);

  if (updatedSupabaseCustomer && !error) {
    const updatedCustomer = await mapSupabaseCustomerToDomain(updatedSupabaseCustomer);
    customers = customers.map(c => c.customerKeyNumber === customerKeyNumber ? updatedCustomer : c);
    notifyCustomerListeners();
    return { success: true };
  } else {
    console.error("DataStore: Failed to update customer. Original error object:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update customer due to an unexpected error.";
    let isNotFoundError = false;
    if (error && typeof error === 'object') {
      const supabaseError = error as any;
      if (supabaseError.code === 'PGRST204') {
        userMessage = "Failed to update customer: Record not found. It may have been deleted.";
        isNotFoundError = true;
      } else if (supabaseError.message) {
        userMessage = `Failed to update customer: ${supabaseError.message}`;
      }
    }
    return { success: false, message: userMessage, isNotFoundError, error };
  }
};

export const deleteCustomer = async (customerKeyNumber: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteCustomerAction(customerKeyNumber);
  if (!error) {
    customers = customers.filter(c => c.customerKeyNumber !== customerKeyNumber);
    notifyCustomerListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete customer. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete customer.", error };
};

export const addBulkMeter = async (
    bulkMeterDomainData: Partial<BulkMeter>,
    currentUser: StaffMember
): Promise<StoreOperationResult<BulkMeter>> => {
  const finalStatus = (currentUser.role.toLowerCase() === 'staff' || currentUser.role.toLowerCase() === 'staff management')
      ? 'Pending Approval'
      : 'Active';

  const bulkMeterPayload = await mapDomainBulkMeterToInsert({ ...bulkMeterDomainData, status: finalStatus });
  
  const { data: newSupabaseBulkMeter, error } = await createBulkMeterAction(bulkMeterPayload);
  if (newSupabaseBulkMeter && !error) {
    const newBulkMeter = await mapSupabaseBulkMeterToDomain(newSupabaseBulkMeter);
    bulkMeters = [newBulkMeter, ...bulkMeters];
    notifyBulkMeterListeners();
    return { success: true, data: newBulkMeter };
  }
  console.error("DataStore: Failed to add bulk meter. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to add bulk meter.", error };
};

export const updateBulkMeter = async (customerKeyNumber: string, bulkMeterData: Partial<Omit<BulkMeter, 'customerKeyNumber'>>): Promise<StoreOperationResult<BulkMeter>> => {
  const updatePayloadToSend = await mapDomainBulkMeterToUpdate({ customerKeyNumber, ...bulkMeterData });
  const { data: updatedSupabaseBulkMeter, error } = await updateBulkMeterAction(customerKeyNumber, updatePayloadToSend);
  if (updatedSupabaseBulkMeter && !error) {
    const updatedBulkMeter = await mapSupabaseBulkMeterToDomain(updatedSupabaseBulkMeter);
    bulkMeters = bulkMeters.map(bm => bm.customerKeyNumber === customerKeyNumber ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
    return { success: true, data: updatedBulkMeter };
  }
  console.error("DataStore: Failed to update bulk meter. Error:", JSON.stringify(error, null, 2));
  let userMessage = "Failed to update bulk meter.";
  let isNotFoundError = false;
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
    userMessage = "Failed to update bulk meter: Record not found.";
    isNotFoundError = true;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    userMessage = `Failed to update bulk meter: ${error.message}`;
  }
  return { success: false, message: userMessage, isNotFoundError, error };
};

export const deleteBulkMeter = async (customerKeyNumber: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteBulkMeterAction(customerKeyNumber);
  if (!error) {
    bulkMeters = bulkMeters.filter(bm => bm.customerKeyNumber !== customerKeyNumber);
    notifyBulkMeterListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete bulk meter. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete bulk meter.", error };
};

export const addStaffMember = async (staffData: Omit<StaffMember, 'id'> & {id?: string}): Promise<StoreOperationResult<StaffMember>> => {
  if (!rolesFetched) {
    await initializeRoles();
  }
  const role = roles.find(r => r.role_name === staffData.role);
  if (!role) {
    return { success: false, message: `Role '${staffData.role}' not found.` };
  }
  
  const staffDataWithRoleId = { ...staffData, roleId: role.id };
  const payload = mapDomainStaffToInsert(staffDataWithRoleId as StaffMember);

  const { data: newSupabaseStaff, error } = await createStaffMemberAction(payload);
  
  if (error) {
    // Check for unique constraint violation
    if ((error as any).code === '23505' && (error as any).message.includes('staff_members_email_key')) {
      return { success: false, message: `A staff member with the email '${staffData.email}' already exists.` };
    }
    // Generic error handling
    console.error("DataStore: Failed to add staff member. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add staff member.", error };
  }

  if (newSupabaseStaff) {
    const newStaff = mapSupabaseStaffToDomain(newSupabaseStaff);
    staffMembers = [newStaff, ...staffMembers];
    notifyStaffMemberListeners();
    return { success: true, data: newStaff };
  }
  
  return { success: false, message: "An unknown error occurred while adding the staff member." };
};


export const updateStaffMember = async (email: string, updatedStaffData: Partial<Omit<StaffMember, 'id' | 'email'>>): Promise<StoreOperationResult<void>> => {
  const staffUpdateDataWithRoleId: Partial<StaffMember> = { ...updatedStaffData };

  // If a role name is being updated, find its ID.
  if (updatedStaffData.role) {
    if (!rolesFetched) {
      await initializeRoles();
    }
    const role = roles.find(r => r.role_name === updatedStaffData.role);
    if (!role) {
      return { success: false, message: `Role '${updatedStaffData.role}' not found.` };
    }
    staffUpdateDataWithRoleId.roleId = role.id;
  }

  const staffUpdatePayload = mapDomainStaffToUpdate(staffUpdateDataWithRoleId);
  const { data: updatedSupabaseStaff, error } = await updateStaffMemberAction(email, staffUpdatePayload);

  if (updatedSupabaseStaff && !error) {
    const updatedStaff = mapSupabaseStaffToDomain(updatedSupabaseStaff);
    staffMembers = staffMembers.map(s => (s.email === email ? updatedStaff : s));
    notifyStaffMemberListeners();
    return { success: true };
  }
  
  console.error("DataStore: Failed to update staff member. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to update staff member.", error };
};


export const deleteStaffMember = async (email: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteStaffMemberAction(email);
  if (error) {
    console.error("DataStore: Failed to delete staff member profile.", error);
    return { success: false, message: (error as any)?.message || "Failed to delete staff profile." };
  }
  
  staffMembers = staffMembers.filter(s => s.email !== email);
  notifyStaffMemberListeners();
  return { success: true };
};

export const addBill = async (billData: Omit<DomainBill, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainBill>> => {
    const payload = mapDomainBillToSupabase(billData) as BillInsert;
    const { data: newSupabaseBill, error } = await createBillAction(payload);
    if (newSupabaseBill && !error) {
        const newBill = mapSupabaseBillToDomain(newSupabaseBill);
        bills = [newBill, ...bills];
        notifyBillListeners();
        return { success: true, data: newBill };
    }
    console.error("DataStore: Failed to add bill. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add bill.", error };
};

export const updateExistingBill = async (id: string, billUpdateData: Partial<Omit<DomainBill, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainBillToSupabase(billUpdateData) as BillUpdate;
    const { data: updatedSupabaseBill, error } = await updateBillAction(id, payload);
    if (updatedSupabaseBill && !error) {
        const updatedBill = mapSupabaseBillToDomain(updatedSupabaseBill);
        bills = bills.map(b => b.id === id ? updatedBill : b);
        notifyBillListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update bill. Supabase error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update bill.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update bill: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update bill: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};

export const removeBill = async (billId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await deleteBillAction(billId);
    if (!error) {
        bills = bills.filter(b => b.id !== billId);
        notifyBillListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete bill. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete bill.", error };
};

export const addIndividualCustomerReading = async (readingData: Omit<DomainIndividualCustomerReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainIndividualCustomerReading>> => {
    const customer = customers.find(c => c.customerKeyNumber === readingData.individualCustomerId);
    if (!customer) {
        return { success: false, message: "Customer not found." };
    }
    if (readingData.readingValue < customer.currentReading) {
        return { success: false, message: `New reading (${readingData.readingValue}) cannot be lower than the current reading (${customer.currentReading}).` };
    }

    const payload = mapDomainIndividualReadingToSupabase(readingData) as IndividualCustomerReadingInsert;
    const { data: newSupabaseReading, error: readingInsertError } = await createIndividualCustomerReadingAction(payload);

    if (readingInsertError || !newSupabaseReading) {
        let userMessage = (readingInsertError as any)?.message || "Failed to add reading.";
        if (readingInsertError && (readingInsertError as any).message.includes('violates row-level security policy')) {
             userMessage = "Permission denied to add readings. Please check Row Level Security policies in Supabase.";
        }
        console.error("DataStore: Failed to add individual reading. Supabase error:", JSON.stringify(readingInsertError, null, 2));
        return { success: false, message: userMessage, error: readingInsertError };
    }

    const updateResult = await updateCustomer(customer.customerKeyNumber, { currentReading: newSupabaseReading.reading_value, month: newSupabaseReading.month_year });

    if (!updateResult.success) {
        await deleteIndividualCustomerReadingAction(newSupabaseReading.id);
        const errorMessage = `Reading recorded, but failed to update the customer's main record. Error: ${updateResult.message}`;
        console.error(errorMessage, updateResult.error);
        return { success: false, message: errorMessage, error: updateResult.error };
    }
    
    const newReading = mapSupabaseIndividualReadingToDomain(newSupabaseReading);
    individualCustomerReadings = [newReading, ...individualCustomerReadings];
    notifyIndividualCustomerReadingListeners();

    return { success: true, data: newReading };
};

export const addBulkMeterReading = async (readingData: Omit<DomainBulkMeterReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainBulkMeterReading>> => {
    const bulkMeter = bulkMeters.find(bm => bm.customerKeyNumber === readingData.bulkMeterId);
    if (!bulkMeter) {
        return { success: false, message: "Bulk meter not found." };
    }
    if (readingData.readingValue < bulkMeter.currentReading) {
        return { success: false, message: `New reading (${readingData.readingValue}) cannot be lower than the current reading (${bulkMeter.currentReading}).` };
    }

    const payload = mapDomainBulkReadingToSupabase(readingData) as BulkMeterReadingInsert;
    const { data: newSupabaseReading, error: readingInsertError } = await createBulkMeterReadingAction(payload);

    if (readingInsertError || !newSupabaseReading) {
        let userMessage = (readingInsertError as any)?.message || "Failed to add reading.";
        if (readingInsertError && (readingInsertError as any).message.includes('violates row-level security policy')) {
            userMessage = "Permission denied to add readings. Please check Row Level Security policies in Supabase.";
        }
        console.error("DataStore: Failed to add bulk meter reading. Supabase error:", JSON.stringify(readingInsertError, null, 2));
        return { success: false, message: userMessage, error: readingInsertError };
    }
    
    const updateResult = await updateBulkMeter(bulkMeter.customerKeyNumber, { currentReading: newSupabaseReading.reading_value, month: newSupabaseReading.month_year });

    if (!updateResult.success) {
        await deleteBulkMeterReadingAction(newSupabaseReading.id);

        const errorMessage = `Failed to update the bulk meter's main record, so the new reading was discarded. Reason: ${updateResult.message}`;
        console.error(errorMessage, updateResult.error);
        return { success: false, message: errorMessage, error: updateResult.error };
    }
    
    const newReading = mapSupabaseBulkReadingToDomain(newSupabaseReading);
    bulkMeterReadings = [newReading, ...bulkMeterReadings];
    notifyBulkMeterReadingListeners();
    
    return { success: true, data: newReading };
};


export const addPayment = async (paymentData: Omit<DomainPayment, 'id'>): Promise<StoreOperationResult<DomainPayment>> => {
    const payload = mapDomainPaymentToSupabase(paymentData) as PaymentInsert;
    const { data: newSupabasePayment, error } = await createPaymentAction(payload);
    if (newSupabasePayment && !error) {
        const newPayment = mapSupabasePaymentToDomain(newSupabasePayment);
        payments = [newPayment, ...payments];
        notifyPaymentListeners();
        return { success: true, data: newPayment };
    }
    console.error("DataStore: Failed to add payment. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add payment.", error };
};
export const updateExistingPayment = async (id: string, paymentUpdateData: Partial<Omit<DomainPayment, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainPaymentToSupabase(paymentUpdateData) as PaymentUpdate;
    const { data: updatedSupabasePayment, error } = await updatePaymentAction(id, payload);
    if (updatedSupabasePayment && !error) {
        const updatedPayment = mapSupabasePaymentToDomain(updatedSupabasePayment);
        payments = payments.map(p => p.id === id ? updatedPayment : p);
        notifyPaymentListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update payment. Supabase error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update payment.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update payment: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update payment: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};
export const removePayment = async (paymentId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await deletePaymentAction(paymentId);
    if (!error) {
        payments = payments.filter(p => p.id !== paymentId);
        notifyPaymentListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete payment. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete payment.", error };
};

export const addReportLog = async (logData: Omit<DomainReportLog, 'id' | 'generatedAt'> & { generatedAt?: string } ): Promise<StoreOperationResult<DomainReportLog>> => {
    const payload = mapDomainReportLogToSupabase(logData) as ReportLogInsert;
    if(!payload.generated_at) payload.generated_at = new Date().toISOString();
    const { data: newSupabaseLog, error } = await createReportLogAction(payload);
    if (newSupabaseLog && !error) {
        const newLog = mapSupabaseReportLogToDomain(newSupabaseLog);
        reportLogs = [newLog, ...reportLogs];
        notifyReportLogListeners();
        return { success: true, data: newLog };
    }
    console.error("DataStore: Failed to add report log. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add report log.", error };
};
export const updateExistingReportLog = async (id: string, logUpdateData: Partial<Omit<DomainReportLog, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainReportLogToSupabase(logUpdateData) as ReportLogUpdate;
    const { data: updatedSupabaseLog, error } = await updateReportLogAction(id, payload);
    if (updatedSupabaseLog && !error) {
        const updatedLog = mapSupabaseReportLogToDomain(updatedSupabaseLog);
        reportLogs = reportLogs.map(l => l.id === id ? updatedLog : l);
        notifyReportLogListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update report log. Supabase error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update report log.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update report log: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update report log: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};
export const removeReportLog = async (logId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await deleteReportLogAction(logId);
    if (!error) {
        reportLogs = reportLogs.filter(l => l.id !== logId);
        notifyReportLogListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete report log. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete report log.", error };
};

export const addNotification = async (notificationData: Omit<DomainNotification, 'id' | 'createdAt'>): Promise<StoreOperationResult<DomainNotification>> => {
  const { data, error } = await createNotificationAction({
    title: notificationData.title,
    message: notificationData.message,
    sender_name: notificationData.senderName,
    target_branch_id: notificationData.targetBranchId
  })

  if (data && !error) {
    const newNotification = mapSupabaseNotificationToDomain(data as SupabaseNotificationRow);
    notifications = [newNotification, ...notifications].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    notifyNotificationListeners();
    return { success: true, data: newNotification };
  }

  console.error("DataStore: Failed to add notification. DB error:", JSON.stringify(error, null, 2));
  
  let userMessage = (error as any)?.message || "Failed to add notification.";
  if (error && (error as any).message?.includes('function public.insert_notification does not exist')) {
    userMessage = "The database is missing a required function. Please run the SQL script provided in the instructions to create it.";
  }
  
  return { success: false, message: userMessage, error };
};

export const updateRolePermissions = async (roleId: number, permissionIds: number[]): Promise<StoreOperationResult<void>> => {
    const { error } = await rpcUpdateRolePermissionsAction(roleId, permissionIds);
    if (!error) {
        await fetchAllRolePermissions();
        return { success: true };
    }
    console.error("DataStore: Failed to update role permissions. RPC error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to update permissions.", error };
};


export const updateTariff = async (customerType: CustomerType, year: number, tariff: Partial<TariffInfo>): Promise<StoreOperationResult<void>> => {
    const updatePayload: TariffUpdate = {};
    if (tariff.tiers) updatePayload.tiers = tariff.tiers;
    if (tariff.maintenance_percentage) updatePayload.maintenance_percentage = tariff.maintenance_percentage;
    if (tariff.sanitation_percentage) updatePayload.sanitation_percentage = tariff.sanitation_percentage;
    if (tariff.sewerage_rate_per_m3) updatePayload.sewerage_rate_per_m3 = tariff.sewerage_rate_per_m3;
    if (tariff.meter_rent_prices) updatePayload.meter_rent_prices = tariff.meter_rent_prices;
    if (tariff.vat_rate) updatePayload.vat_rate = tariff.vat_rate;
    if (tariff.domestic_vat_threshold_m3) updatePayload.domestic_vat_threshold_m3 = tariff.domestic_vat_threshold_m3;

    const { data: updatedSupabaseTariff, error } = await updateTariffAction(customerType, year, updatePayload);
    if (updatedSupabaseTariff && !error) {
        tariffs = tariffs.map(t => (t.customer_type === customerType && t.year === year) ? updatedSupabaseTariff : t);
        notifyTariffListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update tariff. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to update tariff.", error };
};

export const addTariff = async (tariffData: Omit<TariffInfo, 'id'>): Promise<StoreOperationResult<TariffInfo>> => {
    const payload: TariffInsert = {
        customer_type: tariffData.customer_type,
        year: tariffData.year,
        tiers: tariffData.tiers,
        maintenance_percentage: tariffData.maintenance_percentage,
        sanitation_percentage: tariffData.sanitation_percentage,
        sewerage_rate_per_m3: tariffData.sewerage_rate_per_m3,
        meter_rent_prices: tariffData.meter_rent_prices,
        vat_rate: tariffData.vat_rate,
        domestic_vat_threshold_m3: tariffData.domestic_vat_threshold_m3,
    };
    const { data, error } = await createTariffAction(payload);
    if (data && !error) {
        tariffs = [...tariffs, data];
        notifyTariffListeners();
        const mappedData = getTariff(data.customer_type as CustomerType, data.year);
        if (mappedData) {
          return { success: true, data: mappedData };
        } else {
          return { success: false, message: "Failed to map new tariff after creation." };
        }
    }
    console.error("DataStore: Failed to add tariff. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add tariff.", error };
};

// --- Approval Workflow Functions ---
export const approveCustomer = async (customerKeyNumber: string, approverId: string): Promise<StoreOperationResult<void>> => {
  const updatePayload: Partial<DomainIndividualCustomer> = {
    status: 'Active',
    approved_by: approverId,
    approved_at: new Date().toISOString(),
  };
  return await updateCustomer(customerKeyNumber, updatePayload);
};

export const rejectCustomer = async (customerKeyNumber: string, rejectorId: string): Promise<StoreOperationResult<void>> => {
  const updatePayload: Partial<DomainIndividualCustomer> = {
    status: 'Rejected',
    approved_by: rejectorId, // Log who rejected it
    approved_at: new Date().toISOString(),
  };
  return await updateCustomer(customerKeyNumber, updatePayload);
};

export const approveBulkMeter = async (customerKeyNumber: string, approverId: string): Promise<StoreOperationResult<void>> => {
    const updatePayload: Partial<BulkMeter> = {
        status: 'Active',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
    };
    return await updateBulkMeter(customerKeyNumber, updatePayload);
}

export const rejectBulkMeter = async (customerKeyNumber: string, rejectorId: string): Promise<StoreOperationResult<void>> => {
    const updatePayload: Partial<BulkMeter> = {
        status: 'Rejected',
        approved_by: rejectorId,
        approved_at: new Date().toISOString(),
    };
    return await updateBulkMeter(customerKeyNumber, updatePayload);
}


export const subscribeToBranches = (listener: Listener<DomainBranch>): (() => void) => {
  branchListeners.add(listener);
  if (branchesFetched) listener([...branches]); else initializeBranches().then(() => listener([...branches]));
  return () => branchListeners.delete(listener);
};

export const subscribeToCustomers = (listener: Listener<DomainIndividualCustomer>): (() => void) => {
  customerListeners.add(listener);
  if (customersFetched) listener([...customers]); else initializeCustomers().then(() => listener([...customers]));
  return () => customerListeners.delete(listener);
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  if (bulkMetersFetched) listener([...bulkMeters]); else initializeBulkMeters().then(() => listener([...bulkMeters]));
  return () => bulkMeterListeners.delete(listener);
};

export const subscribeToStaffMembers = (listener: Listener<StaffMember>): (() => void) => {
  staffMemberListeners.add(listener);
  if (staffMembersFetched) listener([...staffMembers]); else initializeStaffMembers().then(() => listener([...staffMembers]));
  return () => staffMemberListeners.delete(listener);
};

export const subscribeToBills = (listener: Listener<DomainBill>): (() => void) => {
    billListeners.add(listener);
    if (billsFetched) listener([...bills]); else initializeBills().then(() => listener([...bills]));
    return () => billListeners.delete(listener);
};
export const subscribeToIndividualCustomerReadings = (listener: Listener<DomainIndividualCustomerReading>): (() => void) => {
    individualCustomerReadingListeners.add(listener);
    if (individualCustomerReadingsFetched) listener([...individualCustomerReadings]); else initializeIndividualCustomerReadings().then(() => listener([...individualCustomerReadings]));
    return () => individualCustomerReadingListeners.delete(listener);
};
export const subscribeToBulkMeterReadings = (listener: Listener<DomainBulkMeterReading>): (() => void) => {
    bulkMeterReadingListeners.add(listener);
    if (bulkMeterReadingsFetched) listener([...bulkMeterReadings]); else initializeBulkMeterReadings().then(() => listener([...bulkMeterReadings]));
    return () => bulkMeterReadingListeners.delete(listener);
};
export const subscribeToPayments = (listener: Listener<DomainPayment>): (() => void) => {
    paymentListeners.add(listener);
    if (paymentsFetched) listener([...payments]); else initializePayments().then(() => listener([...payments]));
    return () => paymentListeners.delete(listener);
};
export const subscribeToReportLogs = (listener: Listener<DomainReportLog>): (() => void) => {
    reportLogListeners.add(listener);
    if (reportLogsFetched) listener([...reportLogs]); else initializeReportLogs().then(() => listener([...reportLogs]));
    return () => reportLogListeners.delete(listener);
};
export const subscribeToNotifications = (listener: Listener<DomainNotification>): (() => void) => {
  notificationListeners.add(listener);
  if (notificationsFetched) listener([...notifications]); else initializeNotifications().then(() => listener([...notifications]));
  return () => notificationListeners.delete(listener);
};
export const subscribeToRoles = (listener: Listener<DomainRole>): (() => void) => {
  roleListeners.add(listener);
  if (rolesFetched) listener([...roles]); else initializeRoles().then(() => listener([...roles]));
  return () => roleListeners.delete(listener);
};

export const subscribeToPermissions = (listener: Listener<DomainPermission>): (() => void) => {
  permissionListeners.add(listener);
  if (permissionsFetched) listener([...permissions]); else initializePermissions().then(() => listener([...permissions]));
  return () => permissionListeners.delete(listener);
};

export const subscribeToRolePermissions = (listener: Listener<DomainRolePermission>): (() => void) => {
  rolePermissionListeners.add(listener);
  if (rolePermissionsFetched) listener([...rolePermissions]); else initializeRolePermissions().then(() => listener([...rolePermissions]));
  return () => rolePermissionListeners.delete(listener);
};

export const subscribeToTariffs = (listener: Listener<TariffRow>): (() => void) => {
    tariffListeners.add(listener);
    if (tariffsFetched) listener([...tariffs]); else initializeTariffs().then(() => listener([...tariffs]));
    return () => tariffListeners.delete(listener);
};


export const authenticateStaffMember = async (email: string, password: string): Promise<StoreOperationResult<StaffMember>> => {
    const { data: staffData, error: staffError } = await getStaffMemberForAuthAction(email, password);

    if (staffError || !staffData) {
        if (staffError) {
            console.error("DataStore: Authentication error:", JSON.stringify(staffError, null, 2));
        }
        return { success: false, message: "Invalid email or password.", isNotFoundError: true, error: staffError };
    }

    const user = mapSupabaseStaffToDomain(staffData);

    let userRoleId = user.roleId;

    if (!userRoleId && user.role) {
        if (!rolesFetched) await initializeRoles();
        const foundRole = roles.find(r => r.role_name === user.role);
        if (foundRole) {
            userRoleId = foundRole.id;
            user.roleId = userRoleId;
        } else {
            console.error(`DataStore: Could not find a matching role ID for role name "${user.role}" during login for user ${email}.`);
        }
    }
    
    let permissions: string[] = [];
    if (userRoleId) {
        const { data: rolePerms, error: permissionError } = await getAllRolePermissionsAction();
        const { data: allPerms } = await getAllPermissionsAction();

        if (rolePerms && allPerms && !permissionError) {
            const permissionIdsForRole = new Set(rolePerms.filter(rp => rp.role_id === userRoleId).map(rp => rp.permission_id));
            permissions = allPerms.filter(p => permissionIdsForRole.has(p.id)).map(p => p.name);
        } else if (permissionError) {
            console.error("DataStore: Failed to fetch permissions for role.", permissionError);
        }
    }
    user.permissions = permissions;
    
    if (user.branchName) {
        if (branches.length === 0) {
          await initializeBranches();
        }
        
        const normalizeBranchName = (name: string) => name.toLowerCase().replace(/\s*branch\s*$/, '').trim();
        const normalizedStaffBranchName = normalizeBranchName(user.branchName);

        const matchedBranch = branches.find(b => {
            const normalizedOfficialName = normalizeBranchName(b.name);
            return normalizedOfficialName === normalizedStaffBranchName || normalizedOfficialName.includes(normalizedStaffBranchName) || normalizedStaffBranchName.includes(normalizedOfficialName);
        });
        
        if (matchedBranch) {
            user.branchId = matchedBranch.id;
            user.branchName = matchedBranch.name;
        } else {
            console.warn(`DataStore: Could not find a branch matching the name "${user.branchName}" for user ${user.email}.`);
            user.branchName = 'Unknown Branch';
            delete user.branchId;
        }
    }
    
    return { success: true, data: user };
};

export const getBulkMeterByCustomerKey = async (key: string): Promise<StoreOperationResult<BulkMeter>> => {
  const { data, error } = await supabase.from('bulk_meters').select('*').eq('customerKeyNumber', key).single();
  if (error || !data) {
    return { success: false, message: "Bulk meter not found", error };
  }
  const domainData = await mapSupabaseBulkMeterToDomain(data);
  return { success: true, data: domainData };
};


export async function loadInitialData() {
  await initializeTariffs();
  await Promise.all([
    initializeBranches(),
    initializeCustomers(),
    initializeBulkMeters(), 
    initializeStaffMembers(),
    initializeBills(),
    initializeIndividualCustomerReadings(),
    initializeBulkMeterReadings(),
    initializePayments(),
    initializeReportLogs(),
    initializeNotifications(),
    initializeRoles(),
    initializePermissions(),
    initializeRolePermissions(),
  ]);
}
