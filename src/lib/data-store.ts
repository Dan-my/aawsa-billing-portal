

"use client";

import type { IndividualCustomer as DomainIndividualCustomer, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter as DomainBulkMeterTypeFromTypes } from '@/app/admin/bulk-meters/bulk-meter-types'; 
import type { Branch as DomainBranch } from '@/app/admin/branches/branch-types';
import type { StaffMember } from '@/app/admin/staff-management/staff-types';
import { calculateBill, type CustomerType, type SewerageConnection, type PaymentStatus, type BillCalculationResult } from '@/lib/billing';


import type {
  Branch as SupabaseBranchRow,
  BulkMeterRow as SupabaseBulkMeterRow,
  IndividualCustomer as SupabaseIndividualCustomerRow,
  StaffMember as SupabaseStaffMemberRow,
  Bill as SupabaseBillRow,
  IndividualCustomerReading as SupabaseIndividualCustomerReadingRow,
  BulkMeterReading as SupabaseBulkMeterReadingRow,
  Payment as SupabasePaymentRow,
  ReportLog as SupabaseReportLogRow,
  BranchInsert, BranchUpdate,
  BulkMeterInsert, BulkMeterUpdate,
  IndividualCustomerInsert, IndividualCustomerUpdate,
  StaffMemberInsert, StaffMemberUpdate,
  BillInsert, BillUpdate,
  IndividualCustomerReadingInsert, IndividualCustomerReadingUpdate,
  BulkMeterReadingInsert, BulkMeterReadingUpdate,
  PaymentInsert, PaymentUpdate,
  ReportLogInsert, ReportLogUpdate,
} from './supabase';

import {
  supabase, // Import the supabase client directly
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
  getAllIndividualCustomerReadings as supabaseGetAllIndividualCustomerReadings,
  createIndividualCustomerReading as supabaseCreateIndividualCustomerReading,
  updateIndividualCustomerReading as supabaseUpdateIndividualCustomerReading,
  deleteIndividualCustomerReading as supabaseDeleteIndividualCustomerReading,
  getAllBulkMeterReadings as supabaseGetAllBulkMeterReadings,
  createBulkMeterReading as supabaseCreateBulkMeterReading,
  updateBulkMeterReading as supabaseUpdateBulkMeterReading,
  deleteBulkMeterReading as supabaseDeleteBulkMeterReading,
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


let branches: DomainBranch[] = [];
let customers: DomainIndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let staffMembers: StaffMember[] = [];
let bills: DomainBill[] = [];
let individualCustomerReadings: DomainIndividualCustomerReading[] = [];
let bulkMeterReadings: DomainBulkMeterReading[] = [];
let payments: DomainPayment[] = [];
let reportLogs: DomainReportLog[] = [];

let branchesFetched = false;
let customersFetched = false;
let bulkMetersFetched = false;
let staffMembersFetched = false;
let billsFetched = false;
let individualCustomerReadingsFetched = false;
let bulkMeterReadingsFetched = false;
let paymentsFetched = false;
let reportLogsFetched = false;

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

const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers]));
const notifyBillListeners = () => billListeners.forEach(listener => listener([...bills]));
const notifyIndividualCustomerReadingListeners = () => individualCustomerReadingListeners.forEach(listener => listener([...individualCustomerReadings]));
const notifyBulkMeterReadingListeners = () => bulkMeterReadingListeners.forEach(listener => listener([...bulkMeterReadings]));
const notifyPaymentListeners = () => paymentListeners.forEach(listener => listener([...payments])); 
const notifyReportLogListeners = () => reportLogListeners.forEach(listener => listener([...reportLogs]));

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
  const { totalBill: bill } = calculateBill(usage, sc.customerType, sc.sewerageConnection, Number(sc.meterSize));
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
    branchId: sc.branch_id || undefined,
    status: sc.status as IndividualCustomerStatus,
    paymentStatus: sc.paymentStatus as PaymentStatus,
    calculatedBill: bill,
    arrears: sc.arrears ? Number(sc.arrears) : 0,
    created_at: sc.created_at,
    updated_at: sc.updated_at,
  };
};

const mapDomainCustomerToInsert = (
  customer: Omit<DomainIndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'>
): IndividualCustomerInsert => {
  const usage = customer.currentReading - customer.previousReading;
  const { totalBill: bill } = calculateBill(usage, customer.customerType, customer.sewerageConnection, Number(customer.meterSize));
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
    branch_id: customer.branchId, 
    status: 'Active', 
    paymentStatus: 'Unpaid', 
    calculatedBill: bill,
    arrears: customer.arrears ? Number(customer.arrears) : 0,
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
  if(customer.branchId !== undefined) updatePayload.branch_id = customer.branchId; 
  if(customer.status !== undefined) updatePayload.status = customer.status;
  if(customer.paymentStatus !== undefined) updatePayload.paymentStatus = customer.paymentStatus;
  if(customer.arrears !== undefined) updatePayload.arrears = Number(customer.arrears);

  if (customer.currentReading !== undefined || customer.previousReading !== undefined || customer.customerType !== undefined || customer.sewerageConnection !== undefined || customer.meterSize !== undefined) {
    const existingCustomer = customers.find(c => c.id === customer.id);
    if (existingCustomer) {
        const usage = (customer.currentReading ?? existingCustomer.currentReading) - (customer.previousReading ?? existingCustomer.previousReading);
        const { totalBill } = calculateBill(
            usage,
            customer.customerType ?? existingCustomer.customerType,
            customer.sewerageConnection ?? existingCustomer.sewerageConnection,
            Number(customer.meterSize ?? existingCustomer.meterSize)
        );
        updatePayload.calculatedBill = totalBill;
    }
  }
  return updatePayload;
};


const mapSupabaseBulkMeterToDomain = (sbm: SupabaseBulkMeterRow): BulkMeter => {
  const calculatedBmUsage = (sbm.currentReading ?? 0) - (sbm.previousReading ?? 0);
  const bmUsage = sbm.bulk_usage === null || sbm.bulk_usage === undefined
                  ? calculatedBmUsage
                  : Number(sbm.bulk_usage);

  const { totalBill: calculatedBmTotalBill } = calculateBill(bmUsage, "Non-domestic", "No", Number(sbm.meterSize));
  const bmTotalBill = sbm.total_bulk_bill === null || sbm.total_bulk_bill === undefined
                      ? calculatedBmTotalBill
                      : Number(sbm.total_bulk_bill);
  return {
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
    branchId: sbm.branch_id || undefined, 
    status: sbm.status,
    paymentStatus: sbm.paymentStatus,
    bulkUsage: bmUsage,
    totalBulkBill: bmTotalBill,
    differenceUsage: sbm.difference_usage === null || sbm.difference_usage === undefined ? undefined : Number(sbm.difference_usage),
    differenceBill: sbm.difference_bill === null || sbm.difference_bill === undefined ? undefined : Number(sbm.difference_bill),
    outStandingbill: sbm.outStandingbill ? Number(sbm.outStandingbill) : 0, 
  };
};


const mapDomainBulkMeterToInsert = (bm: Omit<BulkMeter, 'id'>): BulkMeterInsert => {
  const calculatedBulkUsage = (bm.currentReading ?? 0) - (bm.previousReading ?? 0);
  const { totalBill: calculatedTotalBulkBill } = calculateBill(calculatedBulkUsage, "Non-domestic", "No", Number(bm.meterSize));

  return {
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
    branch_id: bm.branchId, 
    status: bm.status || 'Active',
    paymentStatus: bm.paymentStatus || 'Unpaid',
    bulk_usage: calculatedBulkUsage,
    total_bulk_bill: calculatedTotalBulkBill,
    difference_usage: calculatedBulkUsage,
    difference_bill: calculatedTotalBulkBill,
    outStandingbill: bm.outStandingbill ? Number(bm.outStandingbill) : 0, 
  };
};


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
    if (bm.branchId !== undefined) updatePayload.branch_id = bm.branchId; 
    if (bm.status !== undefined) updatePayload.status = bm.status;
    if (bm.paymentStatus !== undefined) updatePayload.paymentStatus = bm.paymentStatus;
    if (bm.outStandingbill !== undefined) updatePayload.outStandingbill = Number(bm.outStandingbill); 

    if (bm.id && (bm.currentReading !== undefined || bm.previousReading !== undefined || bm.meterSize !== undefined)) {
        const existingBM = bulkMeters.find(b => b.id === bm.id);
        const currentReading = bm.currentReading ?? existingBM?.currentReading ?? 0;
        const previousReading = bm.previousReading ?? existingBM?.previousReading ?? 0;
        const meterSize = bm.meterSize ?? existingBM?.meterSize ?? 0;
        
        const newBulkUsage = currentReading - previousReading;
        const { totalBill: newTotalBulkBill } = calculateBill(newBulkUsage, "Non-domestic", "No", Number(meterSize));

        updatePayload.bulk_usage = newBulkUsage;
        updatePayload.total_bulk_bill = newTotalBulkBill;

        const allIndividualCustomers = getCustomers(); 
        const associatedCustomers = allIndividualCustomers.filter(c => c.assignedBulkMeterId === bm.id);
        
        const sumIndividualUsage = associatedCustomers.reduce((acc, cust) => {
            const usage = (cust.currentReading ?? 0) - (cust.previousReading ?? 0);
            return acc + usage;
        }, 0);
        
        const sumIndividualBill = associatedCustomers.reduce((acc, cust) => {
            return acc + (cust.calculatedBill ?? 0);
        }, 0);

        updatePayload.difference_usage = newBulkUsage - sumIndividualUsage;
        updatePayload.difference_bill = newTotalBulkBill - sumIndividualBill;
    }
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

const mapDomainStaffToInsert = (staff: Omit<StaffMember, 'id' | 'password'>): StaffMemberInsert => ({
  name: staff.name,
  email: staff.email,
  branch: staff.branch,
  status: staff.status,
  phone: staff.phone,
  hire_date: staff.hireDate,
  role: staff.role,
});

const mapDomainStaffToUpdate = (staff: Partial<Omit<StaffMember, 'id'>>): StaffMemberUpdate => {
    const updatePayload: StaffMemberUpdate = {};
    if(staff.name !== undefined) updatePayload.name = staff.name;
    // Email is the unique identifier, should not be updated.
    if(staff.branch !== undefined) updatePayload.branch = staff.branch;
    if(staff.status !== undefined) updatePayload.status = staff.status;
    if(staff.phone !== undefined) updatePayload.phone = staff.phone;
    if(staff.hireDate !== undefined) updatePayload.hire_date = staff.hireDate;
    if(staff.role !== undefined) updatePayload.role = staff.role;
    if(staff.password !== undefined && staff.password) updatePayload.password = staff.password; // For Supabase Auth update
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
  const { data: rawBulkMeters, error: fetchError } = await supabaseGetAllBulkMeters();

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
  
  const updatedRowsFromBackfill: SupabaseBulkMeterRow[] = [];
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
      const { totalBill: calculatedTotalBulkBill } = calculateBill(calculatedBulkUsage, "Non-domestic", "No", Number(sbm.meterSize));

      const associatedCustomersData = getCustomers().filter(c => c.assignedBulkMeterId === sbm.id);
      const sumIndividualUsage = associatedCustomersData.reduce((acc, cust) => acc + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);
      const sumIndividualBill = associatedCustomersData.reduce((acc, cust) => acc + (cust.calculatedBill ?? 0), 0);

      const calculatedDifferenceUsage = calculatedBulkUsage - sumIndividualUsage;
      const calculatedDifferenceBill = calculatedTotalBulkBill - sumIndividualBill;

      const updatePayload: BulkMeterUpdate = {
        bulk_usage: calculatedBulkUsage,
        total_bulk_bill: calculatedTotalBulkBill,
        difference_usage: calculatedDifferenceUsage,
        difference_bill: calculatedDifferenceBill,
      };

      const { data: updatedRow, error: updateError } = await supabaseUpdateBulkMeter(sbm.id, updatePayload);
      if (updateError) {
        console.error(`DataStore: Failed to backfill bulk meter ${sbm.id}. Error:`, JSON.stringify(updateError, null, 2));
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
  
  bulkMeters = processedBulkMeters.map(mapSupabaseBulkMeterToDomain);
  notifyBulkMeterListeners();
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

async function fetchAllIndividualCustomerReadings() {
    const { data, error } = await supabaseGetAllIndividualCustomerReadings();
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
    const { data, error } = await supabaseGetAllBulkMeterReadings();
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

export const getBranches = (): DomainBranch[] => [...branches];
export const getCustomers = (): DomainIndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getStaffMembers = (): StaffMember[] => [...staffMembers];
export const getBills = (): DomainBill[] => [...bills];
export const getIndividualCustomerReadings = (): DomainIndividualCustomerReading[] => [...individualCustomerReadings];
export const getBulkMeterReadings = (): DomainBulkMeterReading[] => [...bulkMeterReadings];

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
  if (!staffData.password) {
    return { success: false, message: "Password is required to create a new staff member." };
  }

  // 1. Create the auth user.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: staffData.email,
    password: staffData.password,
  });

  if (authError || !authData.user) {
    console.error("DataStore Auth Error:", authError);
    if (authError?.message.includes("already registered")) {
      return { success: false, message: "A user with this email already exists." };
    }
    return { success: false, message: authError?.message || "Failed to create authentication user." };
  }

  // 2. Create the profile, linked by the new user's ID.
  const staffPayload: StaffMemberInsert = {
    ...mapDomainStaffToInsert(staffData),
    id: authData.user.id, // Use the ID from the new auth user
    password: null, // Don't store password in the public table
  };
  
  const { data: newSupabaseStaff, error: profileError } = await supabaseCreateStaffMember(staffPayload);

  if (profileError) {
    console.error("DataStore Profile Error:", JSON.stringify(profileError, null, 2));
    // In a real app, you would try to delete the auth user for cleanup, which requires admin privileges.
    return { success: false, message: (profileError as any)?.message || "Auth user created, but failed to create staff profile." };
  }
  
  if (newSupabaseStaff) {
      const newStaff = mapSupabaseStaffToDomain(newSupabaseStaff);
      staffMembers = [newStaff, ...staffMembers];
      notifyStaffMemberListeners();
      return { success: true, data: newStaff };
  }

  return { success: false, message: "An unknown error occurred." };
};

export const updateStaffMember = async (id: string, updatedStaffData: Partial<Omit<StaffMember, 'id'>>): Promise<StoreOperationResult<void>> => {
  const { password, ...domainData } = updatedStaffData;
  const staffUpdatePayload = mapDomainStaffToUpdate(domainData);

  // Update profile in staff_members table
  const { data: updatedSupabaseStaff, error: profileError } = await supabaseUpdateStaffMember(id, staffUpdatePayload);

  if (profileError) {
    console.error("DataStore: Failed to update staff profile.", profileError);
    return { success: false, message: "Failed to update staff profile." };
  }

  // If a new password was provided, update it in Supabase Auth
  if (password) {
    // This requires elevated privileges and should be done in a server environment
    // For client-side, this will likely fail without proper RLS/setup
    const { error: authError } = await supabase.auth.admin.updateUserById(id, { password });
    if (authError) {
      console.error("DataStore: Failed to update user password.", authError);
      return { success: false, message: "Profile updated, but failed to update password. This requires admin privileges." };
    }
  }

  if (updatedSupabaseStaff) {
    const updatedStaff = mapSupabaseStaffToDomain(updatedSupabaseStaff);
    staffMembers = staffMembers.map(s => s.id === id ? updatedStaff : s);
    notifyStaffMemberListeners();
    return { success: true };
  }
  
  return { success: false, message: "Failed to update staff member." };
};


export const deleteStaffMember = async (staffId: string): Promise<StoreOperationResult<void>> => {
  // This function should ONLY be called from a secure, server-side environment.
  // Calling `deleteUser` from the client is a major security risk.
  
  // 1. Delete from the public table first
  const { error: profileError } = await supabaseDeleteStaffMember(staffId);
  if (profileError) {
    console.error("DataStore: Failed to delete staff member profile.", profileError);
    return { success: false, message: (profileError as any)?.message || "Failed to delete staff profile." };
  }
  
  // 2. Delete the user from `auth.users`
  const { error: authError } = await supabase.auth.admin.deleteUser(staffId);
  if (authError) {
    console.error("DataStore: Failed to delete auth user.", authError);
    // Profile was deleted but auth user wasn't. This is an inconsistent state.
    return { success: false, message: "Profile deleted, but failed to delete login account. Please contact support." };
  }

  staffMembers = staffMembers.filter(s => s.id !== staffId);
  notifyStaffMemberListeners();
  return { success: true };
};


export const addIndividualCustomerReading = async (readingData: Omit<DomainIndividualCustomerReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainIndividualCustomerReading>> => {
    const customer = customers.find(c => c.id === readingData.individualCustomerId);
    if (!customer) {
        return { success: false, message: "Customer not found." };
    }
    if (readingData.readingValue < customer.currentReading) {
        return { success: false, message: `New reading (${readingData.readingValue}) cannot be lower than the current reading (${customer.currentReading}).` };
    }

    const payload = mapDomainIndividualReadingToSupabase(readingData) as IndividualCustomerReadingInsert;
    const { data: newSupabaseReading, error: readingInsertError } = await supabaseCreateIndividualCustomerReading(payload);

    if (readingInsertError || !newSupabaseReading) {
        let userMessage = (readingInsertError as any)?.message || "Failed to add reading.";
        if (readingInsertError && (readingInsertError as any).message.includes('violates row-level security policy')) {
             userMessage = "Permission denied to add readings. Please check Row Level Security policies in Supabase.";
        }
        console.error("DataStore: Failed to add individual reading. Supabase error:", JSON.stringify(readingInsertError, null, 2));
        return { success: false, message: userMessage, error: readingInsertError };
    }

    // At this point, reading is inserted. Now try to update the customer.
    const customerUpdatePayload = { ...customer, currentReading: newSupabaseReading.reading_value };
    const updateResult = await updateCustomer(customerUpdatePayload);

    if (!updateResult.success) {
        // The customer update failed. We must roll back the reading insert.
        await supabaseDeleteIndividualCustomerReading(newSupabaseReading.id);

        const errorMessage = `Failed to update the customer's main record, so the new reading was discarded. Reason: ${updateResult.message}`;
        console.error(errorMessage, updateResult.error);
        return { success: false, message: errorMessage, error: updateResult.error };
    }

    // Both operations succeeded. Now update local caches and notify.
    const newReading = mapSupabaseIndividualReadingToDomain(newSupabaseReading);
    individualCustomerReadings = [newReading, ...individualCustomerReadings];
    notifyIndividualCustomerReadingListeners();

    // The customer cache was already updated inside `updateCustomer`, so we are consistent.

    return { success: true, data: newReading };
};

export const addBulkMeterReading = async (readingData: Omit<DomainBulkMeterReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainBulkMeterReading>> => {
    const bulkMeter = bulkMeters.find(bm => bm.id === readingData.bulkMeterId);
    if (!bulkMeter) {
        return { success: false, message: "Bulk meter not found." };
    }
    if (readingData.readingValue < bulkMeter.currentReading) {
        return { success: false, message: `New reading (${readingData.readingValue}) cannot be lower than the current reading (${bulkMeter.currentReading}).` };
    }

    const payload = mapDomainBulkReadingToSupabase(readingData) as BulkMeterReadingInsert;
    const { data: newSupabaseReading, error: readingInsertError } = await supabaseCreateBulkMeterReading(payload);

    if (readingInsertError || !newSupabaseReading) {
        let userMessage = (readingInsertError as any)?.message || "Failed to add reading.";
        if (readingInsertError && (readingInsertError as any).message.includes('violates row-level security policy')) {
            userMessage = "Permission denied to add readings. Please check Row Level Security policies in Supabase.";
        }
        console.error("DataStore: Failed to add bulk meter reading. Supabase error:", JSON.stringify(readingInsertError, null, 2));
        return { success: false, message: userMessage, error: readingInsertError };
    }
    
    // At this point, reading is inserted. Now try to update the bulk meter.
    const bulkMeterUpdatePayload = { ...bulkMeter, currentReading: newSupabaseReading.reading_value };
    const updateResult = await updateBulkMeter(bulkMeterUpdatePayload);

    if (!updateResult.success) {
        // The bulk meter update failed. We must roll back the reading insert.
        await supabaseDeleteBulkMeterReading(newSupabaseReading.id);

        const errorMessage = `Failed to update the bulk meter's main record, so the new reading was discarded. Reason: ${updateResult.message}`;
        console.error(errorMessage, updateResult.error);
        return { success: false, message: errorMessage, error: updateResult.error };
    }
    
    // Both operations succeeded. Now update local caches and notify.
    const newReading = mapSupabaseBulkReadingToDomain(newSupabaseReading);
    bulkMeterReadings = [newReading, ...bulkMeterReadings];
    notifyBulkMeterReadingListeners();
    
    return { success: true, data: newReading };
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

export async function loadInitialData() {
  await initializeCustomers();
  await Promise.all([
    initializeBranches(),
    initializeBulkMeters(), 
    initializeStaffMembers(),
    initializeBills(),
    initializeIndividualCustomerReadings(),
    initializeBulkMeterReadings(),
    initializePayments(),
    initializeReportLogs(),
  ]);
}
