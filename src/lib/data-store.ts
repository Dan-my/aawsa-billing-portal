
"use client";

import type { IndividualCustomer as DomainIndividualCustomer, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch as DomainBranch } from '@/app/admin/branches/branch-types';
import type { StaffMember } from '@/app/admin/staff-management/staff-types';
import { calculateBill, type CustomerType, type SewerageConnection, type PaymentStatus } from '@/lib/billing';


import type {
  Branch as SupabaseBranchRow,
  BulkMeterRow as SupabaseBulkMeterRow,
  IndividualCustomer as SupabaseIndividualCustomerRow,
  StaffMember as SupabaseStaffMemberRow,
  Bill as SupabaseBillRow,
  MeterReading as SupabaseMeterReadingRow,
  Payment as SupabasePaymentRow,
  ReportLog as SupabaseReportLogRow,
  BranchInsert, BranchUpdate,
  BulkMeterInsert, BulkMeterUpdate,
  IndividualCustomerInsert, IndividualCustomerUpdate,
  StaffMemberInsert, StaffMemberUpdate,
  BillInsert, BillUpdate,
  MeterReadingInsert, MeterReadingUpdate,
  PaymentInsert, PaymentUpdate,
  ReportLogInsert, ReportLogUpdate
} from './supabase';

import {
  getAllBranches as supabaseGetAllBranches,
  createBranch as supabaseCreateBranch,
  updateBranch as supabaseUpdateBranch,
  deleteBranch as supabaseDeleteBranch,
  getAllCustomers as supabaseGetAllCustomers,
  createCustomer as supabaseCreateCustomer,
  updateCustomer as supabaseUpdateCustomer,
  deleteCustomer as supabaseDeleteCustomer,
  getAllBulkMeters as supabaseGetAllBulkMeters,
  createBulkMeter as supabaseCreateBulkMeter,
  updateBulkMeter as supabaseUpdateBulkMeter,
  deleteBulkMeter as supabaseDeleteBulkMeter,
  getAllStaffMembers as supabaseGetAllStaffMembers,
  createStaffMember as supabaseCreateStaffMember,
  updateStaffMember as supabaseUpdateStaffMember,
  deleteStaffMember as supabaseDeleteStaffMember,
  getAllBills as supabaseGetAllBills,
  createBill as supabaseCreateBill,
  updateBill as supabaseUpdateBill,
  deleteBill as supabaseDeleteBill,
  getAllMeterReadings as supabaseGetAllMeterReadings,
  createMeterReading as supabaseCreateMeterReading,
  updateMeterReading as supabaseUpdateMeterReading,
  deleteMeterReading as supabaseDeleteMeterReading,
  getAllPayments as supabaseGetAllPayments,
  createPayment as supabaseCreatePayment,
  updatePayment as supabaseUpdatePayment,
  deletePayment as supabaseDeletePayment,
  getAllReportLogs as supabaseGetAllReportLogs,
  createReportLog as supabaseCreateReportLog,
  updateReportLog as supabaseUpdateReportLog,
  deleteReportLog as supabaseDeleteReportLog,
} from './supabase';


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
  baseWaterCharge: number;
  sewerageCharge?: number | null;
  maintenanceFee?: number | null;
  sanitationFee?: number | null;
  meterRent?: number | null;
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

export interface DomainMeterReading {
  id: string;
  meterType: 'individual_customer_meter' | 'bulk_meter';
  individualCustomerId?: string | null;
  bulkMeterId?: string | null;
  readerStaffId?: string | null;
  readingDate: string;
  monthYear: string;
  readingValue: number;
  isEstimate?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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


let branches: DomainBranch[] = [];
let customers: DomainIndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let staffMembers: StaffMember[] = [];
let bills: DomainBill[] = [];
let meterReadings: DomainMeterReading[] = [];
let payments: DomainPayment[] = [];
let reportLogs: DomainReportLog[] = [];

let branchesFetched = false;
let customersFetched = false;
let bulkMetersFetched = false;
let staffMembersFetched = false;
let billsFetched = false;
let meterReadingsFetched = false;
let paymentsFetched = false;
let reportLogsFetched = false;

type Listener<T> = (data: T[]) => void;
const branchListeners: Set<Listener<DomainBranch>> = new Set();
const customerListeners: Set<Listener<DomainIndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const staffMemberListeners: Set<Listener<StaffMember>> = new Set();
const billListeners: Set<Listener<DomainBill>> = new Set();
const meterReadingListeners: Set<Listener<DomainMeterReading>> = new Set();
const paymentListeners: Set<Listener<DomainPayment>> = new Set();
const reportLogListeners: Set<Listener<DomainReportLog>> = new Set();

const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers]));
const notifyBillListeners = () => billListeners.forEach(listener => listener([...bills]));
const notifyMeterReadingListeners = () => meterReadingListeners.forEach(listener => listener([...meterReadings]));
const notifyPaymentListeners = () => payments.forEach(listener => listener([...payments]));
const notifyReportLogListeners = () => reportLogs.forEach(listener => listener([...reportLogs]));

// --- Mappers ---
const mapSupabaseBranchToDomain = (sb: SupabaseBranchRow): DomainBranch => ({
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


const mapSupabaseCustomerToDomain = (sc: SupabaseIndividualCustomerRow): DomainIndividualCustomer => {
  const usage = sc.currentReading - sc.previousReading;
  const bill = calculateBill(usage, sc.customerType, sc.sewerageConnection);
  return {
    id: sc.id,
    name: sc.name,
    customerKeyNumber: sc.customerKeyNumber,
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
    location: sc.location,
    ward: sc.ward,
    sewerageConnection: sc.sewerageConnection,
    assignedBulkMeterId: sc.assignedBulkMeterId || undefined,
    status: sc.status as IndividualCustomerStatus,
    paymentStatus: sc.paymentStatus as PaymentStatus,
    calculatedBill: bill,
    created_at: sc.created_at,
    updated_at: sc.updated_at,
  };
};

const mapDomainCustomerToInsert = (
  customer: Omit<DomainIndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'>
): IndividualCustomerInsert => {
  const usage = customer.currentReading - customer.previousReading;
  const bill = calculateBill(usage, customer.customerType, customer.sewerageConnection);
  return {
    name: customer.name,
    customerKeyNumber: customer.customerKeyNumber,
    contractNumber: customer.contractNumber,
    customerType: customer.customerType,
    bookNumber: customer.bookNumber,
    ordinal: Number(customer.ordinal) || 0,
    meterSize: Number(customer.meterSize) || 0,
    meterNumber: customer.meterNumber,
    previousReading: Number(customer.previousReading) || 0,
    currentReading: Number(customer.currentReading) || 0,
    month: customer.month,
    specificArea: customer.specificArea,
    location: customer.location,
    ward: customer.ward,
    sewerageConnection: customer.sewerageConnection,
    assignedBulkMeterId: customer.assignedBulkMeterId,
    status: 'Active', // Default status for new customers
    paymentStatus: 'Unpaid', // Default payment status
    calculatedBill: bill,
  };
};

const mapDomainCustomerToUpdate = (customer: Partial<DomainIndividualCustomer>): IndividualCustomerUpdate => {
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
  if(customer.location !== undefined) updatePayload.location = customer.location;
  if(customer.ward !== undefined) updatePayload.ward = customer.ward;
  if(customer.sewerageConnection !== undefined) updatePayload.sewerageConnection = customer.sewerageConnection;
  if(customer.assignedBulkMeterId !== undefined) updatePayload.assignedBulkMeterId = customer.assignedBulkMeterId;
  if(customer.status !== undefined) updatePayload.status = customer.status;
  if(customer.paymentStatus !== undefined) updatePayload.paymentStatus = customer.paymentStatus;

  // Recalculate bill if relevant fields change
  if (customer.currentReading !== undefined || customer.previousReading !== undefined || customer.customerType !== undefined || customer.sewerageConnection !== undefined) {
    const existingCustomer = customers.find(c => c.id === customer.id);
    if (existingCustomer) {
        const usage = (customer.currentReading ?? existingCustomer.currentReading) - (customer.previousReading ?? existingCustomer.previousReading);
        updatePayload.calculatedBill = calculateBill(
            usage,
            customer.customerType ?? existingCustomer.customerType,
            customer.sewerageConnection ?? existingCustomer.sewerageConnection
        );
    }
  }
  return updatePayload;
};


const mapSupabaseBulkMeterToDomain = (sbm: SupabaseBulkMeterRow): BulkMeter => ({
  id: sbm.id,
  name: sbm.name,
  customerKeyNumber: sbm.customerKeyNumber,
  contractNumber: sbm.contractNumber,
  meterSize: Number(sbm.meterSize),
  meterNumber: sbm.meterNumber,
  previousReading: Number(sbm.previousReading),
  currentReading: Number(sbm.currentReading),
  month: sbm.month,
  specificArea: sbm.specificArea,
  location: sbm.location,
  ward: sbm.ward,
  status: sbm.status,
  paymentStatus: sbm.paymentStatus,
});


const mapDomainBulkMeterToInsert = (bm: Omit<BulkMeter, 'id'>): BulkMeterInsert => ({
  name: bm.name,
  customerKeyNumber: bm.customerKeyNumber,
  contractNumber: bm.contractNumber,
  meterSize: Number(bm.meterSize) || 0,
  meterNumber: bm.meterNumber,
  previousReading: Number(bm.previousReading) || 0,
  currentReading: Number(bm.currentReading) || 0,
  month: bm.month,
  specificArea: bm.specificArea,
  location: bm.location,
  ward: bm.ward,
  status: bm.status || 'Active',
  paymentStatus: bm.paymentStatus || 'Unpaid',
});


const mapDomainBulkMeterToUpdate = (bm: Partial<BulkMeter> & { id?: string } ): BulkMeterUpdate => {
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
    if (bm.location !== undefined) updatePayload.location = bm.location;
    if (bm.ward !== undefined) updatePayload.ward = bm.ward;
    if (bm.status !== undefined) updatePayload.status = bm.status;
    if (bm.paymentStatus !== undefined) updatePayload.paymentStatus = bm.paymentStatus;
    return updatePayload;
};


const mapSupabaseStaffToDomain = (ss: SupabaseStaffMemberRow): StaffMember => ({
  id: ss.id,
  name: ss.name,
  email: ss.email,
  password: ss.password || undefined,
  branch: ss.branch,
  status: ss.status,
  phone: ss.phone || undefined,
  hireDate: ss.hire_date || undefined,
  role: ss.role,
});

const mapDomainStaffToInsert = (staff: Omit<StaffMember, 'id'>): StaffMemberInsert => ({
  name: staff.name,
  email: staff.email,
  password: staff.password,
  branch: staff.branch,
  status: staff.status,
  phone: staff.phone,
  hire_date: staff.hireDate,
  role: staff.role,
});

const mapDomainStaffToUpdate = (staff: Partial<Omit<StaffMember, 'id'>>): StaffMemberUpdate => {
    const updatePayload: StaffMemberUpdate = {};
    if(staff.name !== undefined) updatePayload.name = staff.name;
    if(staff.email !== undefined) updatePayload.email = staff.email;
    if(staff.password !== undefined) updatePayload.password = staff.password;
    if(staff.branch !== undefined) updatePayload.branch = staff.branch;
    if(staff.status !== undefined) updatePayload.status = staff.status;
    if(staff.phone !== undefined) updatePayload.phone = staff.phone;
    if(staff.hireDate !== undefined) updatePayload.hire_date = staff.hireDate;
    if(staff.role !== undefined) updatePayload.role = staff.role;
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
  baseWaterCharge: Number(sb.base_water_charge),
  sewerageCharge: sb.sewerage_charge ? Number(sb.sewerage_charge) : null,
  maintenanceFee: sb.maintenance_fee ? Number(sb.maintenance_fee) : null,
  sanitationFee: sb.sanitation_fee ? Number(sb.sanitation_fee) : null,
  meterRent: sb.meter_rent ? Number(sb.meter_rent) : null,
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
    if (bill.baseWaterCharge !== undefined) payload.base_water_charge = bill.baseWaterCharge;
    if (bill.sewerageCharge !== undefined) payload.sewerage_charge = bill.sewerageCharge;
    if (bill.maintenanceFee !== undefined) payload.maintenance_fee = bill.maintenanceFee;
    if (bill.sanitationFee !== undefined) payload.sanitation_fee = bill.sanitationFee;
    if (bill.meterRent !== undefined) payload.meter_rent = bill.meterRent;
    if (bill.totalAmountDue !== undefined) payload.total_amount_due = bill.totalAmountDue;
    if (bill.amountPaid !== undefined) payload.amount_paid = bill.amountPaid;
    if (bill.dueDate !== undefined) payload.due_date = bill.dueDate;
    if (bill.paymentStatus !== undefined) payload.payment_status = bill.paymentStatus;
    if (bill.billNumber !== undefined) payload.bill_number = bill.billNumber;
    if (bill.notes !== undefined) payload.notes = bill.notes;
    return payload;
};

const mapSupabaseMeterReadingToDomain = (smr: SupabaseMeterReadingRow): DomainMeterReading => ({
  id: smr.id,
  meterType: smr.meter_type,
  individualCustomerId: smr.individual_customer_id,
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

const mapDomainMeterReadingToSupabase = (mr: Partial<DomainMeterReading>): Partial<MeterReadingInsert | MeterReadingUpdate> => {
    const payload: Partial<MeterReadingInsert | MeterReadingUpdate> = {};
    if (mr.meterType !== undefined) payload.meter_type = mr.meterType;
    if (mr.individualCustomerId !== undefined) payload.individual_customer_id = mr.individualCustomerId;
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


async function fetchAllBranches() {
  const { data, error } = await supabaseGetAllBranches();
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
  const { data, error } = await supabaseGetAllCustomers();
  if (data) {
    customers = data.map(mapSupabaseCustomerToDomain);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to fetch customers. Supabase error:", JSON.stringify(error, null, 2));
  }
  customersFetched = true;
  return customers;
}

async function fetchAllBulkMeters() {
  const { data, error } = await supabaseGetAllBulkMeters();
  if (data) {
    bulkMeters = data.map(mapSupabaseBulkMeterToDomain);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to fetch bulk meters. Supabase error:", JSON.stringify(error, null, 2));
  }
  bulkMetersFetched = true;
  return bulkMeters;
}

async function fetchAllStaffMembers() {
  const { data, error } = await supabaseGetAllStaffMembers();
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
    const { data, error } = await supabaseGetAllBills();
    if (data) {
        bills = data.map(mapSupabaseBillToDomain);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to fetch bills. Supabase error:", JSON.stringify(error, null, 2));
    }
    billsFetched = true;
    return bills;
}

async function fetchAllMeterReadings() {
    const { data, error } = await supabaseGetAllMeterReadings();
    if (data) {
        meterReadings = data.map(mapSupabaseMeterReadingToDomain);
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch meter readings. Supabase error:", JSON.stringify(error, null, 2));
    }
    meterReadingsFetched = true;
    return meterReadings;
}

async function fetchAllPayments() {
    const { data, error } = await supabaseGetAllPayments();
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
    const { data, error } = await supabaseGetAllReportLogs();
    if (data) {
        reportLogs = data.map(mapSupabaseReportLogToDomain);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to fetch report logs. Supabase error:", JSON.stringify(error, null, 2));
    }
    reportLogsFetched = true;
    return reportLogs;
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
export const initializeMeterReadings = async () => {
    if (!meterReadingsFetched || meterReadings.length === 0) await fetchAllMeterReadings();
};
export const initializePayments = async () => {
    if (!paymentsFetched || payments.length === 0) await fetchAllPayments();
};
export const initializeReportLogs = async () => {
    if (!reportLogsFetched || reportLogs.length === 0) await fetchAllReportLogs();
};

export const getBranches = (): DomainBranch[] => [...branches];
export const getCustomers = (): DomainIndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getStaffMembers = (): StaffMember[] => [...staffMembers];
export const getBills = (): DomainBill[] => [...bills];
export const getMeterReadings = (): DomainMeterReading[] => [...meterReadings];
export const getPayments = (): DomainPayment[] => [...payments];
export const getReportLogs = (): DomainReportLog[] => [...reportLogs];

export const addBranch = async (branchData: Omit<DomainBranch, 'id'>): Promise<StoreOperationResult<DomainBranch>> => {
  const payload = mapDomainBranchToInsert(branchData);
  const { data: newSupabaseBranch, error } = await supabaseCreateBranch(payload);
  if (newSupabaseBranch && !error) {
    const newBranch = mapSupabaseBranchToDomain(newSupabaseBranch);
    branches = [newBranch, ...branches];
    notifyBranchListeners();
    return { success: true, data: newBranch };
  }
  console.error("DataStore: Failed to add branch. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: error?.message || "Failed to add branch.", error };
};

export const updateBranch = async (updatedBranchData: DomainBranch): Promise<StoreOperationResult<void>> => {
  const { id, ...domainData } = updatedBranchData;
  const updatePayload = mapDomainBranchToUpdate(domainData);
  const { data: updatedSupabaseBranch, error } = await supabaseUpdateBranch(id, updatePayload);
  if (updatedSupabaseBranch && !error) {
    const updatedBranch = mapSupabaseBranchToDomain(updatedSupabaseBranch);
    branches = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
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
  const { error } = await supabaseDeleteBranch(branchId);
  if (!error) {
    branches = branches.filter(b => b.id !== branchId);
    notifyBranchListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete branch. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete branch.", error };
};

export const addCustomer = async (
  customerData: Omit<DomainIndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'>
): Promise<StoreOperationResult<DomainIndividualCustomer>> => {
  const customerPayload = mapDomainCustomerToInsert(customerData);
  const { data: newSupabaseCustomer, error } = await supabaseCreateCustomer(customerPayload);

  if (newSupabaseCustomer && !error) {
    const newCustomer = mapSupabaseCustomerToDomain(newSupabaseCustomer);
    customers = [newCustomer, ...customers];
    notifyCustomerListeners();
    return { success: true, data: newCustomer };
  }
  console.error("DataStore: Failed to add customer. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to add customer.", error };
};

export const updateCustomer = async (updatedCustomerData: DomainIndividualCustomer): Promise<StoreOperationResult<void>> => {
  const { id } = updatedCustomerData;
  const updatePayloadSupabase = mapDomainCustomerToUpdate(updatedCustomerData);
  const { data: updatedSupabaseCustomer, error } = await supabaseUpdateCustomer(id, updatePayloadSupabase);

  if (updatedSupabaseCustomer && !error) {
    const updatedCustomer = mapSupabaseCustomerToDomain(updatedSupabaseCustomer);
    customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    notifyCustomerListeners();
    return { success: true };
  } else {
    console.error("DataStore: Failed to update customer. Original error object:", error);
    let userMessage = "Failed to update customer due to an unexpected error.";
    let isNotFoundError = false;
    if (error && typeof error === 'object') {
      const supabaseError = error as any;
      console.error("Error details (JSON):", JSON.stringify(supabaseError, null, 2));
      if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
      if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
      if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
      if (supabaseError.code) console.error("Supabase code:", supabaseError.code);

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

export const deleteCustomer = async (customerId: string): Promise<StoreOperationResult<void>> => {
  const { error } = await supabaseDeleteCustomer(customerId);
  if (!error) {
    customers = customers.filter(c => c.id !== customerId);
    notifyCustomerListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete customer. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete customer.", error };
};

export const addBulkMeter = async (bulkMeterDomainData: Omit<BulkMeter, 'id'>): Promise<StoreOperationResult<BulkMeter>> => {
  const bulkMeterPayload = mapDomainBulkMeterToInsert(bulkMeterDomainData) as BulkMeterInsert;
  const { data: newSupabaseBulkMeter, error } = await supabaseCreateBulkMeter(bulkMeterPayload);
  if (newSupabaseBulkMeter && !error) {
    const newBulkMeter = mapSupabaseBulkMeterToDomain(newSupabaseBulkMeter);
    bulkMeters = [newBulkMeter, ...bulkMeters];
    notifyBulkMeterListeners();
    return { success: true, data: newBulkMeter };
  }
  console.error("DataStore: Failed to add bulk meter. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to add bulk meter.", error };
};

export const updateBulkMeter = async (updatedBulkMeterData: BulkMeter): Promise<StoreOperationResult<void>> => {
  const { id, ...domainData } = updatedBulkMeterData;
  const updatePayloadToSend = mapDomainBulkMeterToUpdate({ id, ...domainData }) as BulkMeterUpdate;
  const { data: updatedSupabaseBulkMeter, error } = await supabaseUpdateBulkMeter(id, updatePayloadToSend);
  if (updatedSupabaseBulkMeter && !error) {
    const updatedBulkMeter = mapSupabaseBulkMeterToDomain(updatedSupabaseBulkMeter);
    bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
    return { success: true };
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

export const updateBulkMeterPaymentStatus = async (id: string, newPaymentStatus: PaymentStatus): Promise<StoreOperationResult<void>> => {
  const updatePayload: BulkMeterUpdate = { paymentStatus: newPaymentStatus };
  const { data: updatedSupabaseBulkMeter, error } = await supabaseUpdateBulkMeter(id, updatePayload);
  if (updatedSupabaseBulkMeter && !error) {
    const updatedBulkMeter = mapSupabaseBulkMeterToDomain(updatedSupabaseBulkMeter);
    bulkMeters = bulkMeters.map(bm =>
      bm.id === updatedBulkMeter.id
        ? { ...bm, paymentStatus: updatedBulkMeter.paymentStatus }
        : bm
    );
    notifyBulkMeterListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to update bulk meter payment status. Error:", JSON.stringify(error, null, 2));
  let userMessage = "Failed to update payment status.";
   let isNotFoundError = false;
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
    userMessage = "Failed to update payment status: Record not found.";
    isNotFoundError = true;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    userMessage = `Failed to update payment status: ${error.message}`;
  }
  return { success: false, message: userMessage, isNotFoundError, error };
};


export const deleteBulkMeter = async (bulkMeterId: string): Promise<StoreOperationResult<void>> => {
  const { error } = await supabaseDeleteBulkMeter(bulkMeterId);
  if (!error) {
    bulkMeters = bulkMeters.filter(bm => bm.id !== bulkMeterId);
    notifyBulkMeterListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete bulk meter. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete bulk meter.", error };
};

export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>): Promise<StoreOperationResult<StaffMember>> => {
  const staffPayload = mapDomainStaffToInsert(staffData);
  const { data: newSupabaseStaff, error } = await supabaseCreateStaffMember(staffPayload);
  if (newSupabaseStaff && !error) {
    const newStaff = mapSupabaseStaffToDomain(newSupabaseStaff);
    staffMembers = [newStaff, ...staffMembers];
    notifyStaffMemberListeners();
    return { success: true, data: newStaff };
  }
  console.error("DataStore: Failed to add staff member. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to add staff member.", error };
};

export const updateStaffMember = async (updatedStaffData: StaffMember): Promise<StoreOperationResult<void>> => {
  const { id, ...domainData } = updatedStaffData;
  const staffUpdatePayload = mapDomainStaffToUpdate(domainData);
  const { data: updatedSupabaseStaff, error } = await supabaseUpdateStaffMember(id, staffUpdatePayload);
  if (updatedSupabaseStaff && !error) {
    const updatedStaff = mapSupabaseStaffToDomain(updatedSupabaseStaff);
    staffMembers = staffMembers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    notifyStaffMemberListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to update staff member. Error:", JSON.stringify(error, null, 2));
  let userMessage = "Failed to update staff member.";
  let isNotFoundError = false;
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
    userMessage = "Failed to update staff member: Record not found.";
    isNotFoundError = true;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    userMessage = `Failed to update staff member: ${error.message}`;
  }
  return { success: false, message: userMessage, isNotFoundError, error };
};

export const deleteStaffMember = async (staffId: string): Promise<StoreOperationResult<void>> => {
  const { error } = await supabaseDeleteStaffMember(staffId);
  if (!error) {
    staffMembers = staffMembers.filter(s => s.id !== staffId);
    notifyStaffMemberListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete staff member. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete staff member.", error };
};

export const addBill = async (billData: Omit<DomainBill, 'id'>): Promise<StoreOperationResult<DomainBill>> => {
    const payload = mapDomainBillToSupabase(billData) as BillInsert;
    const { data: newSupabaseBill, error } = await supabaseCreateBill(payload);
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
    const { data: updatedSupabaseBill, error } = await supabaseUpdateBill(id, payload);
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
    const { error } = await supabaseDeleteBill(billId);
    if (!error) {
        bills = bills.filter(b => b.id !== billId);
        notifyBillListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete bill. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete bill.", error };
};

export const addMeterReading = async (readingData: Omit<DomainMeterReading, 'id'>): Promise<StoreOperationResult<DomainMeterReading>> => {
    const payload = mapDomainMeterReadingToSupabase(readingData) as MeterReadingInsert;
    const { data: newSupabaseReading, error } = await supabaseCreateMeterReading(payload);
    if (newSupabaseReading && !error) {
        const newReading = mapSupabaseMeterReadingToDomain(newSupabaseReading);
        meterReadings = [newReading, ...meterReadings];
        notifyMeterReadingListeners();
        return { success: true, data: newReading };
    }
    console.error("DataStore: Failed to add meter reading. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add meter reading.", error };
};
export const updateExistingMeterReading = async (id: string, readingUpdateData: Partial<Omit<DomainMeterReading, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainMeterReadingToSupabase(readingUpdateData) as MeterReadingUpdate;
    const { data: updatedSupabaseReading, error } = await supabaseUpdateMeterReading(id, payload);
    if (updatedSupabaseReading && !error) {
        const updatedReading = mapSupabaseMeterReadingToDomain(updatedSupabaseReading);
        meterReadings = meterReadings.map(r => r.id === id ? updatedReading : r);
        notifyMeterReadingListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update meter reading. Supabase error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update meter reading.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update meter reading: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update meter reading: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};
export const removeMeterReading = async (readingId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await supabaseDeleteMeterReading(readingId);
    if (!error) {
        meterReadings = meterReadings.filter(r => r.id !== readingId);
        notifyMeterReadingListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete meter reading. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete meter reading.", error };
};

export const addPayment = async (paymentData: Omit<DomainPayment, 'id'>): Promise<StoreOperationResult<DomainPayment>> => {
    const payload = mapDomainPaymentToSupabase(paymentData) as PaymentInsert;
    const { data: newSupabasePayment, error } = await supabaseCreatePayment(payload);
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
    const { data: updatedSupabasePayment, error } = await supabaseUpdatePayment(id, payload);
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
    const { error } = await supabaseDeletePayment(paymentId);
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
    const { data: newSupabaseLog, error } = await supabaseCreateReportLog(payload);
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
    const { data: updatedSupabaseLog, error } = await supabaseUpdateReportLog(id, payload);
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
    const { error } = await supabaseDeleteReportLog(logId);
    if (!error) {
        reportLogs = reportLogs.filter(l => l.id !== logId);
        notifyReportLogListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete report log. Supabase error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete report log.", error };
};

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
export const subscribeToMeterReadings = (listener: Listener<DomainMeterReading>): (() => void) => {
    meterReadingListeners.add(listener);
    if (meterReadingsFetched) listener([...meterReadings]); else initializeMeterReadings().then(() => listener([...meterReadings]));
    return () => meterReadingListeners.delete(listener);
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

export async function loadInitialData() {
  await Promise.all([
    initializeBranches(),
    initializeCustomers(),
    initializeBulkMeters(),
    initializeStaffMembers(),
    initializeBills(),
    initializeMeterReadings(),
    initializePayments(),
    initializeReportLogs(),
  ]);
}
