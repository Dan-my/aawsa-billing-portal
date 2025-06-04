
"use client";

import type { IndividualCustomer, CustomerType, SewerageConnection } from '@/app/admin/individual-customers/individual-customer-types';
import { calculateBill } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch } from '@/app/admin/branches/branch-types';
import type { StaffMember } from '@/app/admin/staff-management/staff-types';

// Supabase Row types (snake_case)
import type { 
  Branch as SupabaseBranchRow,
  BulkMeter as SupabaseBulkMeterRow,
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

// Define camelCase domain types for entities that don't have them yet
// For consistency, even if they structurally match, we use these for clarity in the store.

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
  parameters?: any | null; // Using 'any' for Json type from Supabase
  fileFormat?: string | null;
  fileName?: string | null;
  status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}


// Local cache state (using camelCase domain types)
let branches: Branch[] = [];
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let staffMembers: StaffMember[] = [];
let bills: DomainBill[] = [];
let meterReadings: DomainMeterReading[] = [];
let payments: DomainPayment[] = [];
let reportLogs: DomainReportLog[] = [];


// Flags to see if initial fetch has been attempted
let branchesFetched = false;
let customersFetched = false;
let bulkMetersFetched = false;
let staffMembersFetched = false;
let billsFetched = false;
let meterReadingsFetched = false;
let paymentsFetched = false;
let reportLogsFetched = false;


// Listeners
type Listener<T> = (data: T[]) => void;
const branchListeners: Set<Listener<Branch>> = new Set();
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const staffMemberListeners: Set<Listener<StaffMember>> = new Set();
const billListeners: Set<Listener<DomainBill>> = new Set();
const meterReadingListeners: Set<Listener<DomainMeterReading>> = new Set();
const paymentListeners: Set<Listener<DomainPayment>> = new Set();
const reportLogListeners: Set<Listener<DomainReportLog>> = new Set();


// Notify functions
const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers]));
const notifyBillListeners = () => billListeners.forEach(listener => listener([...bills]));
const notifyMeterReadingListeners = () => meterReadingListeners.forEach(listener => listener([...meterReadings]));
const notifyPaymentListeners = () => paymentListeners.forEach(listener => listener([...payments]));
const notifyReportLogListeners = () => reportLogs.forEach(listener => listener([...reportLogs]));


// --- Mappers ---
const mapSupabaseBranchToDomain = (sb: SupabaseBranchRow): Branch => ({
  id: sb.id,
  name: sb.name,
  location: sb.location,
  contactPerson: sb.contact_person || undefined,
  contactPhone: sb.contact_phone || undefined,
  status: sb.status,
});

const mapDomainBranchToInsert = (branch: Omit<Branch, 'id'>): BranchInsert => ({
  name: branch.name,
  location: branch.location,
  contact_person: branch.contactPerson,
  contact_phone: branch.contactPhone,
  status: branch.status,
});

const mapDomainBranchToUpdate = (branch: Partial<Omit<Branch, 'id'>>): BranchUpdate => ({
  name: branch.name,
  location: branch.location,
  contact_person: branch.contactPerson,
  contact_phone: branch.contactPhone,
  status: branch.status,
});

const mapSupabaseCustomerToDomain = (sc: SupabaseIndividualCustomerRow): IndividualCustomer => ({
  id: sc.id,
  name: sc.name,
  customerKeyNumber: sc.customer_key_number,
  contractNumber: sc.contract_number,
  customerType: sc.customer_type,
  bookNumber: sc.book_number,
  ordinal: Number(sc.ordinal),
  meterSize: Number(sc.meter_size),
  meterNumber: sc.meter_number,
  previousReading: Number(sc.previous_reading),
  currentReading: Number(sc.current_reading),
  month: sc.month,
  specificArea: sc.specific_area,
  location: sc.location,
  ward: sc.ward,
  sewerageConnection: sc.sewerage_connection,
  assignedBulkMeterId: sc.assigned_bulk_meter_id || undefined,
  status: sc.status,
  paymentStatus: sc.payment_status,
  calculatedBill: Number(sc.calculated_bill),
});

const mapDomainCustomerToInsert = (
  customer: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection}
): IndividualCustomerInsert => {
  const usage = customer.currentReading - customer.previousReading;
  const calculatedBill = calculateBill(usage, customer.customerType, customer.sewerageConnection);
  return {
    name: customer.name,
    customer_key_number: customer.customerKeyNumber,
    contract_number: customer.contractNumber,
    customer_type: customer.customerType,
    book_number: customer.bookNumber,
    ordinal: Number(customer.ordinal) || 0,
    meter_size: Number(customer.meterSize) || 0,
    meter_number: customer.meterNumber,
    previous_reading: Number(customer.previousReading) || 0,
    current_reading: Number(customer.currentReading) || 0,
    month: customer.month,
    specific_area: customer.specificArea,
    location: customer.location,
    ward: customer.ward,
    sewerage_connection: customer.sewerageConnection,
    assigned_bulk_meter_id: customer.assignedBulkMeterId,
    status: 'Active', // Default for new
    payment_status: 'Unpaid', // Default for new
    calculated_bill: calculatedBill,
  };
};

const mapDomainCustomerToUpdate = (customer: IndividualCustomer): IndividualCustomerUpdate => {
  const usage = Number(customer.currentReading) - Number(customer.previousReading);
  const calculatedBill = calculateBill(usage, customer.customerType, customer.sewerageConnection);
  return {
    name: customer.name,
    customer_key_number: customer.customerKeyNumber,
    contract_number: customer.contractNumber,
    customer_type: customer.customerType,
    book_number: customer.bookNumber,
    ordinal: Number(customer.ordinal),
    meter_size: Number(customer.meterSize),
    meter_number: customer.meterNumber,
    previous_reading: Number(customer.previousReading),
    current_reading: Number(customer.currentReading),
    month: customer.month,
    specific_area: customer.specificArea,
    location: customer.location,
    ward: customer.ward,
    sewerage_connection: customer.sewerageConnection,
    assigned_bulk_meter_id: customer.assignedBulkMeterId,
    status: customer.status,
    payment_status: customer.paymentStatus,
    calculated_bill: calculatedBill,
  };
};

const mapSupabaseBulkMeterToDomain = (sbm: SupabaseBulkMeterRow): BulkMeter => ({
  id: sbm.id,
  name: sbm.name,
  customerKeyNumber: sbm.customer_key_number,
  contractNumber: sbm.contract_number,
  meterSize: Number(sbm.meter_size),
  meterNumber: sbm.meter_number,
  previousReading: Number(sbm.previous_reading),
  currentReading: Number(sbm.current_reading),
  month: sbm.month,
  specificArea: sbm.specific_area,
  location: sbm.location,
  ward: sbm.ward,
  status: sbm.status,
  paymentStatus: sbm.payment_status,
});

const mapDomainBulkMeterToInsert = (bm: Omit<BulkMeter, 'id'>): BulkMeterInsert => ({
  name: bm.name,
  customer_key_number: bm.customerKeyNumber,
  contract_number: bm.contractNumber,
  meter_size: Number(bm.meterSize) || 0,
  meter_number: bm.meterNumber,
  previous_reading: Number(bm.previousReading) || 0,
  current_reading: Number(bm.currentReading) || 0,
  month: bm.month,
  specific_area: bm.specificArea,
  location: bm.location,
  ward: bm.ward,
  status: bm.status || 'Active',
  payment_status: bm.paymentStatus || 'Unpaid',
});

const mapDomainBulkMeterToUpdate = (bm: BulkMeter): BulkMeterUpdate => ({
  name: bm.name,
  customer_key_number: bm.customerKeyNumber,
  contract_number: bm.contractNumber,
  meter_size: Number(bm.meterSize),
  meter_number: bm.meterNumber,
  previous_reading: Number(bm.previousReading),
  current_reading: Number(bm.currentReading),
  month: bm.month,
  specific_area: bm.specificArea,
  location: bm.location,
  ward: bm.ward,
  status: bm.status,
  payment_status: bm.paymentStatus,
});

const mapSupabaseStaffToDomain = (ss: SupabaseStaffMemberRow): StaffMember => ({
  id: ss.id,
  name: ss.name,
  email: ss.email,
  password: ss.password || undefined,
  branch: ss.branch,
  status: ss.status,
  phone: ss.phone || undefined,
  hireDate: ss.hire_date || undefined,
  role: (ss as any).role || 'Staff', 
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

const mapDomainStaffToUpdate = (staff: StaffMember): StaffMemberUpdate => ({
  name: staff.name,
  email: staff.email,
  password: staff.password,
  branch: staff.branch,
  status: staff.status,
  phone: staff.phone,
  hire_date: staff.hireDate,
  role: staff.role,
});

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

const mapDomainBillToSupabase = (bill: Partial<DomainBill>): Partial<BillInsert | BillUpdate> => ({
    individual_customer_id: bill.individualCustomerId,
    bulk_meter_id: bill.bulkMeterId,
    bill_period_start_date: bill.billPeriodStartDate,
    bill_period_end_date: bill.billPeriodEndDate,
    month_year: bill.monthYear,
    previous_reading_value: bill.previousReadingValue,
    current_reading_value: bill.currentReadingValue,
    base_water_charge: bill.baseWaterCharge,
    sewerage_charge: bill.sewerageCharge,
    maintenance_fee: bill.maintenanceFee,
    sanitation_fee: bill.sanitationFee,
    meter_rent: bill.meterRent,
    total_amount_due: bill.totalAmountDue,
    amount_paid: bill.amountPaid,
    due_date: bill.dueDate,
    payment_status: bill.paymentStatus,
    bill_number: bill.billNumber,
    notes: bill.notes,
});

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

const mapDomainMeterReadingToSupabase = (mr: Partial<DomainMeterReading>): Partial<MeterReadingInsert | MeterReadingUpdate> => ({
    meter_type: mr.meterType,
    individual_customer_id: mr.individualCustomerId,
    bulk_meter_id: mr.bulkMeterId,
    reader_staff_id: mr.readerStaffId,
    reading_date: mr.readingDate,
    month_year: mr.monthYear,
    reading_value: mr.readingValue,
    is_estimate: mr.isEstimate,
    notes: mr.notes,
});

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

const mapDomainPaymentToSupabase = (p: Partial<DomainPayment>): Partial<PaymentInsert | PaymentUpdate> => ({
    bill_id: p.billId,
    individual_customer_id: p.individualCustomerId,
    payment_date: p.paymentDate,
    amount_paid: p.amountPaid,
    payment_method: p.paymentMethod,
    transaction_reference: p.transactionReference,
    processed_by_staff_id: p.processedByStaffId,
    notes: p.notes,
});

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

const mapDomainReportLogToSupabase = (rl: Partial<DomainReportLog>): Partial<ReportLogInsert | ReportLogUpdate> => ({
    report_name: rl.reportName,
    description: rl.description,
    generated_by_staff_id: rl.generatedByStaffId,
    parameters: rl.parameters,
    file_format: rl.fileFormat,
    file_name: rl.fileName,
    status: rl.status,
});


// --- Initialization and Data Fetching ---
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


// --- Initializer functions ---
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


// Getters
export const getBranches = (): Branch[] => [...branches];
export const getCustomers = (): IndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getStaffMembers = (): StaffMember[] => [...staffMembers];
export const getBills = (): DomainBill[] => [...bills];
export const getMeterReadings = (): DomainMeterReading[] => [...meterReadings];
export const getPayments = (): DomainPayment[] => [...payments];
export const getReportLogs = (): DomainReportLog[] => [...reportLogs];


// --- Actions for Branches ---
export const addBranch = async (branchData: Omit<Branch, 'id'>) => {
  const payload = mapDomainBranchToInsert(branchData);
  console.log("DataStore: Attempting to add branch with payload:", JSON.stringify(payload, null, 2));
  const { data: newSupabaseBranch, error } = await supabaseCreateBranch(payload);
  if (newSupabaseBranch && !error) {
    const newBranch = mapSupabaseBranchToDomain(newSupabaseBranch);
    branches = [newBranch, ...branches];
    notifyBranchListeners();
    return newBranch;
  }
  console.error("DataStore: Failed to add branch. Supabase error:", JSON.stringify(error, null, 2));
  if (error && typeof error === 'object') {
    const supabaseError = error as any;
    if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
    if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
    if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
  }
  return null;
};

export const updateBranch = async (updatedBranchData: Branch) => {
  const { id, ...domainData } = updatedBranchData;
  const updatePayload = mapDomainBranchToUpdate(domainData);
  const { data: updatedSupabaseBranch, error } = await supabaseUpdateBranch(id, updatePayload);
  if (updatedSupabaseBranch && !error) {
    const updatedBranch = mapSupabaseBranchToDomain(updatedSupabaseBranch);
    branches = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to update branch. Supabase error:", JSON.stringify(error, null, 2));
  }
};

export const deleteBranch = async (branchId: string) => {
  const { error } = await supabaseDeleteBranch(branchId);
  if (!error) {
    branches = branches.filter(b => b.id !== branchId);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to delete branch. Supabase error:", JSON.stringify(error, null, 2));
  }
};

// --- Actions for Individual Customers ---
export const addCustomer = async (customerData: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection}) => {
  const customerPayload = mapDomainCustomerToInsert(customerData);
  const { data: newSupabaseCustomer, error } = await supabaseCreateCustomer(customerPayload);

  if (newSupabaseCustomer && !error) {
    const newCustomer = mapSupabaseCustomerToDomain(newSupabaseCustomer);
    customers = [newCustomer, ...customers];
    notifyCustomerListeners();
    return newCustomer;
  }
  console.error("DataStore: Failed to add customer. Supabase error:", JSON.stringify(error, null, 2));
  if (error && typeof error === 'object') {
    const supabaseError = error as any;
    if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
    if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
    if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
  }
  return null;
};

export const updateCustomer = async (updatedCustomerData: IndividualCustomer) => {
  const { id } = updatedCustomerData;
  const updatePayloadSupabase = mapDomainCustomerToUpdate(updatedCustomerData);
  const { data: updatedSupabaseCustomer, error } = await supabaseUpdateCustomer(id, updatePayloadSupabase);
  if (updatedSupabaseCustomer && !error) {
    const updatedCustomer = mapSupabaseCustomerToDomain(updatedSupabaseCustomer);
    customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to update customer. Supabase error:", JSON.stringify(error, null, 2));
  }
};

export const deleteCustomer = async (customerId: string) => {
  const { error } = await supabaseDeleteCustomer(customerId);
  if (!error) {
    customers = customers.filter(c => c.id !== customerId);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to delete customer. Supabase error:", JSON.stringify(error, null, 2));
  }
};

// --- Actions for Bulk Meters ---
export const addBulkMeter = async (bulkMeterDomainData: Omit<BulkMeter, 'id'>) => {
  const bulkMeterPayload = mapDomainBulkMeterToInsert(bulkMeterDomainData);
  const { data: newSupabaseBulkMeter, error } = await supabaseCreateBulkMeter(bulkMeterPayload);
  if (newSupabaseBulkMeter && !error) {
    const newBulkMeter = mapSupabaseBulkMeterToDomain(newSupabaseBulkMeter);
    bulkMeters = [newBulkMeter, ...bulkMeters];
    notifyBulkMeterListeners();
    return newBulkMeter;
  }
  console.error("DataStore: Failed to add bulk meter. Supabase error:", JSON.stringify(error, null, 2));
  if (error && typeof error === 'object') {
    const supabaseError = error as any;
    if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
    if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
    if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
  }
  return null;
};

export const updateBulkMeter = async (updatedBulkMeterData: BulkMeter) => {
  const { id } = updatedBulkMeterData;
  const updatePayloadToSend = mapDomainBulkMeterToUpdate(updatedBulkMeterData);
  const { data: updatedSupabaseBulkMeter, error } = await supabaseUpdateBulkMeter(id, updatePayloadToSend);
  if (updatedSupabaseBulkMeter && !error) {
    const updatedBulkMeter = mapSupabaseBulkMeterToDomain(updatedSupabaseBulkMeter);
    bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to update bulk meter. Supabase error:", error);
    if (error && typeof error === 'object') {
        const supabaseError = error as any;
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        if ('message' in error) console.error("Error message:", (error as any).message);
        if ('details' in error) console.error("Error details string:", (error as any).details);
        if ('hint' in error) console.error("Error hint:", (error as any).hint);
        if ('code' in error) console.error("Error code:", (error as any).code);
    }
  }
};

export const deleteBulkMeter = async (bulkMeterId: string) => {
  const { error } = await supabaseDeleteBulkMeter(bulkMeterId);
  if (!error) {
    bulkMeters = bulkMeters.filter(bm => bm.id !== bulkMeterId);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to delete bulk meter. Supabase error:", JSON.stringify(error, null, 2));
  }
};

// --- Actions for Staff Members ---
export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>) => {
  const staffPayload = mapDomainStaffToInsert(staffData);
  const { data: newSupabaseStaff, error } = await supabaseCreateStaffMember(staffPayload);
  if (newSupabaseStaff && !error) {
    const newStaff = mapSupabaseStaffToDomain(newSupabaseStaff);
    staffMembers = [newStaff, ...staffMembers];
    notifyStaffMemberListeners();
    return newStaff;
  }
  console.error("DataStore: Failed to add staff member. Supabase error:", JSON.stringify(error, null, 2));
  if (error && typeof error === 'object') {
    const supabaseError = error as any;
    if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
    if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
    if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
  }
  return null;
};

export const updateStaffMember = async (updatedStaffData: StaffMember) => {
  const { id } = updatedStaffData; 
  const staffUpdatePayload = mapDomainStaffToUpdate(updatedStaffData); 
  const { data: updatedSupabaseStaff, error } = await supabaseUpdateStaffMember(id, staffUpdatePayload);
  if (updatedSupabaseStaff && !error) {
    const updatedStaff = mapSupabaseStaffToDomain(updatedSupabaseStaff);
    staffMembers = staffMembers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to update staff member. Supabase error:", JSON.stringify(error, null, 2));
  }
};

export const deleteStaffMember = async (staffId: string) => {
  const { error } = await supabaseDeleteStaffMember(staffId);
  if (!error) {
    staffMembers = staffMembers.filter(s => s.id !== staffId);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to delete staff member. Supabase error:", JSON.stringify(error, null, 2));
  }
};

// --- Actions for Bills ---
export const addBill = async (billData: Omit<DomainBill, 'id'>) => { 
    const payload = mapDomainBillToSupabase(billData) as BillInsert;
    const { data: newSupabaseBill, error } = await supabaseCreateBill(payload);
    if (newSupabaseBill && !error) {
        const newBill = mapSupabaseBillToDomain(newSupabaseBill);
        bills = [newBill, ...bills]; 
        notifyBillListeners();
        return newBill;
    }
    console.error("DataStore: Failed to add bill. Supabase error:", JSON.stringify(error, null, 2)); return null;
};
export const updateExistingBill = async (id: string, billUpdateData: Partial<Omit<DomainBill, 'id'>>) => { 
    const payload = mapDomainBillToSupabase(billUpdateData) as BillUpdate;
    const { data: updatedSupabaseBill, error } = await supabaseUpdateBill(id, payload);
    if (updatedSupabaseBill && !error) {
        const updatedBill = mapSupabaseBillToDomain(updatedSupabaseBill);
        bills = bills.map(b => b.id === id ? updatedBill : b); 
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to update bill. Supabase error:", JSON.stringify(error, null, 2));
    }
};
export const removeBill = async (billId: string) => {
    const { error } = await supabaseDeleteBill(billId);
    if (!error) {
        bills = bills.filter(b => b.id !== billId);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to delete bill. Supabase error:", JSON.stringify(error, null, 2));
    }
};

// --- Actions for MeterReadings ---
export const addMeterReading = async (readingData: Omit<DomainMeterReading, 'id'>) => { 
    const payload = mapDomainMeterReadingToSupabase(readingData) as MeterReadingInsert;
    const { data: newSupabaseReading, error } = await supabaseCreateMeterReading(payload);
    if (newSupabaseReading && !error) {
        const newReading = mapSupabaseMeterReadingToDomain(newSupabaseReading);
        meterReadings = [newReading, ...meterReadings]; 
        notifyMeterReadingListeners();
        return newReading;
    }
    console.error("DataStore: Failed to add meter reading. Supabase error:", JSON.stringify(error, null, 2)); return null;
};
export const updateExistingMeterReading = async (id: string, readingUpdateData: Partial<Omit<DomainMeterReading, 'id'>>) => { 
    const payload = mapDomainMeterReadingToSupabase(readingUpdateData) as MeterReadingUpdate;
    const { data: updatedSupabaseReading, error } = await supabaseUpdateMeterReading(id, payload);
    if (updatedSupabaseReading && !error) {
        const updatedReading = mapSupabaseMeterReadingToDomain(updatedSupabaseReading);
        meterReadings = meterReadings.map(r => r.id === id ? updatedReading : r); 
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to update meter reading. Supabase error:", JSON.stringify(error, null, 2));
    }
};
export const removeMeterReading = async (readingId: string) => {
    const { error } = await supabaseDeleteMeterReading(readingId);
    if (!error) {
        meterReadings = meterReadings.filter(r => r.id !== readingId);
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to delete meter reading. Supabase error:", JSON.stringify(error, null, 2));
    }
};

// --- Actions for Payments ---
export const addPayment = async (paymentData: Omit<DomainPayment, 'id'>) => { 
    const payload = mapDomainPaymentToSupabase(paymentData) as PaymentInsert;
    const { data: newSupabasePayment, error } = await supabaseCreatePayment(payload);
    if (newSupabasePayment && !error) {
        const newPayment = mapSupabasePaymentToDomain(newSupabasePayment);
        payments = [newPayment, ...payments]; 
        notifyPaymentListeners();
        return newPayment;
    }
    console.error("DataStore: Failed to add payment. Supabase error:", JSON.stringify(error, null, 2)); return null;
};
export const updateExistingPayment = async (id: string, paymentUpdateData: Partial<Omit<DomainPayment, 'id'>>) => { 
    const payload = mapDomainPaymentToSupabase(paymentUpdateData) as PaymentUpdate;
    const { data: updatedSupabasePayment, error } = await supabaseUpdatePayment(id, payload);
    if (updatedSupabasePayment && !error) {
        const updatedPayment = mapSupabasePaymentToDomain(updatedSupabasePayment);
        payments = payments.map(p => p.id === id ? updatedPayment : p); 
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to update payment. Supabase error:", JSON.stringify(error, null, 2));
    }
};
export const removePayment = async (paymentId: string) => {
    const { error } = await supabaseDeletePayment(paymentId);
    if (!error) {
        payments = payments.filter(p => p.id !== paymentId);
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to delete payment. Supabase error:", JSON.stringify(error, null, 2));
    }
};

// --- Actions for ReportLogs ---
export const addReportLog = async (logData: Omit<DomainReportLog, 'id'>) => { 
    const payload = mapDomainReportLogToSupabase(logData) as ReportLogInsert;
    // 'generated_at' is set by default in Supabase, so we don't need to set it from client unless overriding.
    const { data: newSupabaseLog, error } = await supabaseCreateReportLog(payload); 
    if (newSupabaseLog && !error) {
        const newLog = mapSupabaseReportLogToDomain(newSupabaseLog);
        reportLogs = [newLog, ...reportLogs]; 
        notifyReportLogListeners();
        return newLog;
    }
    console.error("DataStore: Failed to add report log. Supabase error:", JSON.stringify(error, null, 2)); return null;
};
export const updateExistingReportLog = async (id: string, logUpdateData: Partial<Omit<DomainReportLog, 'id'>>) => { 
    const payload = mapDomainReportLogToSupabase(logUpdateData) as ReportLogUpdate;
    const { data: updatedSupabaseLog, error } = await supabaseUpdateReportLog(id, payload); 
    if (updatedSupabaseLog && !error) {
        const updatedLog = mapSupabaseReportLogToDomain(updatedSupabaseLog);
        reportLogs = reportLogs.map(l => l.id === id ? updatedLog : l); 
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to update report log. Supabase error:", JSON.stringify(error, null, 2));
    }
};
export const removeReportLog = async (logId: string) => {
    const { error } = await supabaseDeleteReportLog(logId);
    if (!error) {
        reportLogs = reportLogs.filter(l => l.id !== logId);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to delete report log. Supabase error:", JSON.stringify(error, null, 2));
    }
};


// --- Subscribe functions ---
export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => {
  branchListeners.add(listener);
  if (branchesFetched) listener([...branches]); else initializeBranches().then(() => listener([...branches]));
  return () => branchListeners.delete(listener);
};

export const subscribeToCustomers = (listener: Listener<IndividualCustomer>): (() => void) => {
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


// --- Initial data load for the application ---
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

// Helper to get staff role for StaffMember type if it's missing
// This is a workaround for potential schema differences where role might not be on SupabaseStaffMemberRow initially
// It's better to ensure 'role' is on the SupabaseStaffMemberRow type via proper db schema and type generation.
// (StaffMember domain type already includes role)
// function getStaffRole(supabaseStaff: SupabaseStaffMemberRow): 'Admin' | 'Staff' {
//    return (supabaseStaff as any).role === 'Admin' ? 'Admin' : 'Staff';
// }
