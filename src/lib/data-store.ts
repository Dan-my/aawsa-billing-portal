
"use client";

import type { IndividualCustomer, CustomerType, SewerageConnection } from '@/app/admin/individual-customers/individual-customer-types';
import { calculateBill } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch } from '@/app/admin/branches/branch-types';
import type { StaffMember } from '@/app/admin/staff-management/staff-types';
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
import type { BranchInsert, BranchUpdate, BulkMeterInsert, BulkMeterUpdate, IndividualCustomerInsert, IndividualCustomerUpdate, StaffMemberInsert, StaffMemberUpdate, Bill, BillInsert, BillUpdate, MeterReading, MeterReadingInsert, MeterReadingUpdate, Payment, PaymentInsert, PaymentUpdate, ReportLog, ReportLogInsert, ReportLogUpdate } from './supabase';


// Local cache state
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let branches: Branch[] = [];
let staffMembers: StaffMember[] = [];
let bills: Bill[] = [];
let meterReadings: MeterReading[] = [];
let payments: Payment[] = [];
let reportLogs: ReportLog[] = [];


// Flags to see if initial fetch has been attempted
let customersFetched = false;
let bulkMetersFetched = false;
let branchesFetched = false;
let staffMembersFetched = false;
let billsFetched = false;
let meterReadingsFetched = false;
let paymentsFetched = false;
let reportLogsFetched = false;


// Listeners
type Listener<T> = (data: T[]) => void;
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const branchListeners: Set<Listener<Branch>> = new Set();
const staffMemberListeners: Set<Listener<StaffMember>> = new Set();
const billListeners: Set<Listener<Bill>> = new Set();
const meterReadingListeners: Set<Listener<MeterReading>> = new Set();
const paymentListeners: Set<Listener<Payment>> = new Set();
const reportLogListeners: Set<Listener<ReportLog>> = new Set();


// Notify functions
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers]));
const notifyBillListeners = () => billListeners.forEach(listener => listener([...bills]));
const notifyMeterReadingListeners = () => meterReadingListeners.forEach(listener => listener([...meterReadings]));
const notifyPaymentListeners = () => paymentListeners.forEach(listener => listener([...payments]));
const notifyReportLogListeners = () => reportLogListeners.forEach(listener => listener([...reportLogs]));


// --- Initialization and Data Fetching ---
async function fetchAllBranches() {
  const { data, error } = await supabaseGetAllBranches();
  if (data) {
    branches = data;
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to fetch branches. Supabase error:", JSON.stringify(error, null, 2));
    if (error && typeof error === 'object') {
      const supabaseError = error as any;
      if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
      if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
      if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
      if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
    }
  }
  branchesFetched = true;
  return branches;
}

async function fetchAllCustomers() {
  const { data, error } = await supabaseGetAllCustomers();
  if (data) {
    customers = data.map(c => ({
        ...c,
        meterSize: Number(c.meter_size) || 0,
        previousReading: Number(c.previous_reading) || 0,
        currentReading: Number(c.current_reading) || 0,
        ordinal: Number(c.ordinal) || 0,
        calculatedBill: Number(c.calculated_bill) || 0,
    })) as IndividualCustomer[];
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to fetch customers. Supabase error:", JSON.stringify(error, null, 2));
    if (error && typeof error === 'object') {
      const supabaseError = error as any;
      if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
      if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
      if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
      if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
    }
  }
  customersFetched = true;
  return customers;
}

async function fetchAllBulkMeters() {
  const { data, error } = await supabaseGetAllBulkMeters();
  if (data) {
    bulkMeters = data.map(bm => ({
        ...bm,
        meterSize: Number(bm.meter_size) || 0,
        previousReading: Number(bm.previous_reading) || 0,
        currentReading: Number(bm.current_reading) || 0,
    })) as BulkMeter[];
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to fetch bulk meters. Supabase error:", JSON.stringify(error, null, 2));
    if (error && typeof error === 'object') {
      const supabaseError = error as any;
      if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
      if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
      if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
      if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
    }
  }
  bulkMetersFetched = true;
  return bulkMeters;
}

async function fetchAllStaffMembers() {
  const { data, error } = await supabaseGetAllStaffMembers();
  if (data) {
    staffMembers = data;
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to fetch staff members. Supabase error:", JSON.stringify(error, null, 2));
    if (error && typeof error === 'object') {
      const supabaseError = error as any;
      if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
      if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
      if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
      if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
    }
  }
  staffMembersFetched = true;
  return staffMembers;
}

async function fetchAllBills() {
    const { data, error } = await supabaseGetAllBills();
    if (data) {
        bills = data.map(b => ({
            ...b,
            previous_reading_value: Number(b.previous_reading_value) || 0,
            current_reading_value: Number(b.current_reading_value) || 0,
            usage_m3: Number(b.usage_m3) || 0,
            base_water_charge: Number(b.base_water_charge) || 0,
            sewerage_charge: Number(b.sewerage_charge) || 0,
            maintenance_fee: Number(b.maintenance_fee) || 0,
            sanitation_fee: Number(b.sanitation_fee) || 0,
            meter_rent: Number(b.meter_rent) || 0,
            total_amount_due: Number(b.total_amount_due) || 0,
            amount_paid: Number(b.amount_paid) || 0,
            balance_due: Number(b.balance_due) || 0,
        })) as Bill[];
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to fetch bills. Supabase error:", JSON.stringify(error, null, 2));
        if (error && typeof error === 'object') {
            const supabaseError = error as any;
            if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
            if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
            if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
            if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
        }
    }
    billsFetched = true;
    return bills;
}

async function fetchAllMeterReadings() {
    const { data, error } = await supabaseGetAllMeterReadings();
    if (data) {
        meterReadings = data.map(mr => ({
            ...mr,
            reading_value: Number(mr.reading_value) || 0,
        })) as MeterReading[];
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch meter readings. Supabase error:", JSON.stringify(error, null, 2));
        if (error && typeof error === 'object') {
            const supabaseError = error as any;
            if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
            if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
            if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
            if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
        }
    }
    meterReadingsFetched = true;
    return meterReadings;
}

async function fetchAllPayments() {
    const { data, error } = await supabaseGetAllPayments();
    if (data) {
        payments = data.map(p => ({
            ...p,
            amount_paid: Number(p.amount_paid) || 0,
        })) as Payment[];
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to fetch payments. Supabase error:", JSON.stringify(error, null, 2));
        if (error && typeof error === 'object') {
            const supabaseError = error as any;
            if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
            if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
            if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
            if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
        }
    }
    paymentsFetched = true;
    return payments;
}

async function fetchAllReportLogs() {
    const { data, error } = await supabaseGetAllReportLogs();
    if (data) {
        reportLogs = data;
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to fetch report logs. Supabase error:", JSON.stringify(error, null, 2));
        if (error && typeof error === 'object') {
            const supabaseError = error as any;
            if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
            if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
            if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
            if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
        }
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
export const getBills = (): Bill[] => [...bills];
export const getMeterReadings = (): MeterReading[] => [...meterReadings];
export const getPayments = (): Payment[] => [...payments];
export const getReportLogs = (): ReportLog[] => [...reportLogs];


// --- Actions for Branches ---
export const addBranch = async (branchData: Omit<Branch, 'id'>) => {
  console.log("DataStore: Attempting to add branch with data:", JSON.stringify(branchData, null, 2));
  const { data: newBranch, error } = await supabaseCreateBranch(branchData as BranchInsert);
  if (newBranch && !error) {
    branches = [newBranch, ...branches];
    notifyBranchListeners();
    return newBranch;
  }
  console.error("DataStore: Failed to add branch. Raw Supabase error:", error);
  if (error && typeof error === 'object') {
    console.error("Error details (JSON):", JSON.stringify(error, null, 2));
    const supabaseError = error as any;
    if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
    if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
    if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
  }
  return null;
};

export const updateBranch = async (updatedBranchData: Branch) => {
  const { id, ...updatePayload } = updatedBranchData;
  const { data: updatedBranch, error } = await supabaseUpdateBranch(id, updatePayload as BranchUpdate);
  if (updatedBranch && !error) {
    branches = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to update branch. Supabase error:", error);
     if (error && typeof error === 'object') {
        const supabaseError = error as any;
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        if ('message' in error) console.error("Error message:", supabaseError.message);
        if ('details' in error) console.error("Error details string:", supabaseError.details);
        if ('hint' in error)    console.error("Error hint:", supabaseError.hint);
        if ('code' in error)    console.error("Error code:", supabaseError.code);
    }
  }
};

export const deleteBranch = async (branchId: string) => {
  const { error } = await supabaseDeleteBranch(branchId);
  if (!error) {
    branches = branches.filter(b => b.id !== branchId);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to delete branch. Supabase error:", error);
  }
};

// --- Actions for Individual Customers ---
export const addCustomer = async (customerData: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection}) => {
  const usage = customerData.currentReading - customerData.previousReading;
  const calculatedBill = calculateBill(usage, customerData.customerType, customerData.sewerageConnection);

  const customerPayload: IndividualCustomerInsert = {
    name: customerData.name,
    customer_key_number: customerData.customerKeyNumber,
    contract_number: customerData.contractNumber,
    customer_type: customerData.customerType,
    book_number: customerData.bookNumber,
    ordinal: Number(customerData.ordinal) || 0,
    meter_size: Number(customerData.meterSize) || 0,
    meter_number: customerData.meterNumber,
    previous_reading: Number(customerData.previousReading) || 0,
    current_reading: Number(customerData.currentReading) || 0,
    month: customerData.month,
    specific_area: customerData.specificArea,
    location: customerData.location,
    ward: customerData.ward,
    sewerage_connection: customerData.sewerageConnection,
    assigned_bulk_meter_id: customerData.assignedBulkMeterId,
    status: 'Active', // Default status
    payment_status: 'Unpaid', // Default payment status
    calculated_bill: calculatedBill,
  };

  const { data: newCustomerResult, error } = await supabaseCreateCustomer(customerPayload);
  if (newCustomerResult && !error) {
    const newCustomer: IndividualCustomer = {
        ...newCustomerResult,
        // Ensure field names and types match IndividualCustomer type
        customerKeyNumber: newCustomerResult.customer_key_number,
        contractNumber: newCustomerResult.contract_number,
        customerType: newCustomerResult.customer_type,
        bookNumber: newCustomerResult.book_number,
        meterSize: Number(newCustomerResult.meter_size),
        meterNumber: newCustomerResult.meter_number,
        previousReading: Number(newCustomerResult.previous_reading),
        currentReading: Number(newCustomerResult.current_reading),
        specificArea: newCustomerResult.specific_area,
        sewerageConnection: newCustomerResult.sewerage_connection,
        assignedBulkMeterId: newCustomerResult.assigned_bulk_meter_id || undefined,
        paymentStatus: newCustomerResult.payment_status,
        calculatedBill: Number(newCustomerResult.calculated_bill),
        ordinal: Number(newCustomerResult.ordinal),
    };
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
  const { id, ...domainData } = updatedCustomerData; // domainData is camelCase
  const usage = Number(domainData.currentReading) - Number(domainData.previousReading);
  const calculatedBill = calculateBill(usage, domainData.customerType, domainData.sewerageConnection);

  const updatePayloadSupabase: IndividualCustomerUpdate = {
    name: domainData.name,
    customer_key_number: domainData.customerKeyNumber,
    contract_number: domainData.contractNumber,
    customer_type: domainData.customerType,
    book_number: domainData.bookNumber,
    ordinal: Number(domainData.ordinal),
    meter_size: Number(domainData.meterSize),
    meter_number: domainData.meterNumber,
    previous_reading: Number(domainData.previousReading),
    current_reading: Number(domainData.currentReading),
    month: domainData.month,
    specific_area: domainData.specificArea,
    location: domainData.location,
    ward: domainData.ward,
    sewerage_connection: domainData.sewerageConnection,
    assigned_bulk_meter_id: domainData.assignedBulkMeterId,
    status: domainData.status,
    payment_status: domainData.paymentStatus,
    calculated_bill: calculatedBill,
  };

  const { data: updatedCustomerResult, error } = await supabaseUpdateCustomer(id, updatePayloadSupabase);
  if (updatedCustomerResult && !error) {
    const updatedCustomer: IndividualCustomer = {
        ...updatedCustomerResult,
        customerKeyNumber: updatedCustomerResult.customer_key_number,
        contractNumber: updatedCustomerResult.contract_number,
        customerType: updatedCustomerResult.customer_type,
        bookNumber: updatedCustomerResult.book_number,
        meterSize: Number(updatedCustomerResult.meter_size),
        meterNumber: updatedCustomerResult.meter_number,
        previousReading: Number(updatedCustomerResult.previous_reading),
        currentReading: Number(updatedCustomerResult.current_reading),
        specificArea: updatedCustomerResult.specific_area,
        sewerageConnection: updatedCustomerResult.sewerage_connection,
        assignedBulkMeterId: updatedCustomerResult.assigned_bulk_meter_id || undefined,
        paymentStatus: updatedCustomerResult.payment_status,
        calculatedBill: Number(updatedCustomerResult.calculated_bill),
        ordinal: Number(updatedCustomerResult.ordinal),
    };
    customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to update customer. Supabase error:", error);
     if (error && typeof error === 'object') {
        const supabaseError = error as any;
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        if ('message' in error) console.error("Error message:", supabaseError.message);
        if ('details' in error) console.error("Error details string:", supabaseError.details);
        if ('hint' in error)    console.error("Error hint:", supabaseError.hint);
        if ('code' in error)    console.error("Error code:", supabaseError.code);
    }
  }
};

export const deleteCustomer = async (customerId: string) => {
  const { error } = await supabaseDeleteCustomer(customerId);
  if (!error) {
    customers = customers.filter(c => c.id !== customerId);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to delete customer. Supabase error:", error);
  }
};

// --- Actions for Bulk Meters ---
export const addBulkMeter = async (bulkMeterDomainData: Omit<BulkMeter, 'id'>) => {
  const bulkMeterPayload: BulkMeterInsert = {
    name: bulkMeterDomainData.name,
    customer_key_number: bulkMeterDomainData.customerKeyNumber,
    contract_number: bulkMeterDomainData.contractNumber,
    meter_size: Number(bulkMeterDomainData.meterSize) || 0,
    meter_number: bulkMeterDomainData.meterNumber,
    previous_reading: Number(bulkMeterDomainData.previousReading) || 0,
    current_reading: Number(bulkMeterDomainData.currentReading) || 0,
    month: bulkMeterDomainData.month,
    specific_area: bulkMeterDomainData.specificArea,
    location: bulkMeterDomainData.location,
    ward: bulkMeterDomainData.ward,
    status: bulkMeterDomainData.status || 'Active',
    payment_status: bulkMeterDomainData.paymentStatus || 'Unpaid',
  };
  const { data: newBulkMeterResult, error } = await supabaseCreateBulkMeter(bulkMeterPayload);
  if (newBulkMeterResult && !error) {
    const newBulkMeter: BulkMeter = {
        ...newBulkMeterResult,
        // Map snake_case from DB to camelCase for BulkMeter type
        customerKeyNumber: newBulkMeterResult.customer_key_number,
        contractNumber: newBulkMeterResult.contract_number,
        meterSize: Number(newBulkMeterResult.meter_size),
        meterNumber: newBulkMeterResult.meter_number,
        previousReading: Number(newBulkMeterResult.previous_reading),
        currentReading: Number(newBulkMeterResult.current_reading),
        specificArea: newBulkMeterResult.specific_area,
        paymentStatus: newBulkMeterResult.payment_status,
    };
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
  const { id, ...domainData } = updatedBulkMeterData; // domainData is camelCase (BulkMeter type)

  const updatePayloadToSend: BulkMeterUpdate = { // BulkMeterUpdate from supabase types (expects snake_case)
    name: domainData.name,
    customer_key_number: domainData.customerKeyNumber,
    contract_number: domainData.contractNumber,
    meter_size: Number(domainData.meterSize), // Ensure it's a number
    meter_number: domainData.meterNumber,
    previous_reading: Number(domainData.previousReading), // Ensure it's a number
    current_reading: Number(domainData.currentReading),   // Ensure it's a number
    month: domainData.month,
    specific_area: domainData.specificArea,
    location: domainData.location,
    ward: domainData.ward,
    status: domainData.status,
    payment_status: domainData.paymentStatus,
  };

  const { data: updatedBulkMeterResult, error } = await supabaseUpdateBulkMeter(id, updatePayloadToSend);
  if (updatedBulkMeterResult && !error) {
    const updatedBulkMeter: BulkMeter = {
        ...updatedBulkMeterResult,
        // Map snake_case from DB to camelCase for BulkMeter type
        customerKeyNumber: updatedBulkMeterResult.customer_key_number,
        contractNumber: updatedBulkMeterResult.contract_number,
        meterSize: Number(updatedBulkMeterResult.meter_size),
        meterNumber: updatedBulkMeterResult.meter_number,
        previousReading: Number(updatedBulkMeterResult.previous_reading),
        currentReading: Number(updatedBulkMeterResult.current_reading),
        specificArea: updatedBulkMeterResult.specific_area,
        paymentStatus: updatedBulkMeterResult.payment_status,
    };
    bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to update bulk meter. Supabase error:", error);
    if (error && typeof error === 'object') {
        const supabaseError = error as any;
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        if ('message' in error) console.error("Error message:", supabaseError.message);
        if ('details' in error) console.error("Error details string:", supabaseError.details);
        if ('hint' in error)    console.error("Error hint:", supabaseError.hint);
        if ('code' in error)    console.error("Error code:", supabaseError.code);
    }
  }
};

export const deleteBulkMeter = async (bulkMeterId: string) => {
  const { error } = await supabaseDeleteBulkMeter(bulkMeterId);
  if (!error) {
    bulkMeters = bulkMeters.filter(bm => bm.id !== bulkMeterId);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to delete bulk meter. Supabase error:", error);
  }
};

// --- Actions for Staff Members ---
export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>) => {
  const staffPayload: StaffMemberInsert = {
      ...staffData,
      // Assuming StaffMemberInsert expects snake_case if DB does, but your types are camelCase
      // If StaffMemberInsert is also camelCase (from placeholder types), this is fine
  };
  const { data: newStaffResult, error } = await supabaseCreateStaffMember(staffPayload);
  if (newStaffResult && !error) {
    const newStaff: StaffMember = { ...newStaffResult }; // Direct spread if types match
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
  const { id, ...updatePayload } = updatedStaffData; // updatePayload is Omit<StaffMember, "id"> camelCase
  const staffUpdatePayload: StaffMemberUpdate = { ...updatePayload }; // Assuming StaffMemberUpdate matches
  const { data: updatedStaffResult, error } = await supabaseUpdateStaffMember(id, staffUpdatePayload);
  if (updatedStaffResult && !error) {
    const updatedStaff: StaffMember = { ...updatedStaffResult };
    staffMembers = staffMembers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to update staff member. Supabase error:", error);
     if (error && typeof error === 'object') {
        const supabaseError = error as any;
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        if ('message' in error) console.error("Error message:", supabaseError.message);
        if ('details' in error) console.error("Error details string:", supabaseError.details);
        if ('hint' in error)    console.error("Error hint:", supabaseError.hint);
        if ('code' in error)    console.error("Error code:", supabaseError.code);
    }
  }
};

export const deleteStaffMember = async (staffId: string) => {
  const { error } = await supabaseDeleteStaffMember(staffId);
  if (!error) {
    staffMembers = staffMembers.filter(s => s.id !== staffId);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to delete staff member. Supabase error:", error);
  }
};

// --- Actions for Bills ---
export const addBill = async (billData: BillInsert) => { // BillInsert from supabase.ts
    const payload: BillInsert = { // Ensure mapping if DB expects snake_case
        ...billData,
        previous_reading_value: Number(billData.previous_reading_value),
        current_reading_value: Number(billData.current_reading_value),
        base_water_charge: Number(billData.base_water_charge),
        sewerage_charge: Number(billData.sewerage_charge) || 0,
        maintenance_fee: Number(billData.maintenance_fee) || 0,
        sanitation_fee: Number(billData.sanitation_fee) || 0,
        meter_rent: Number(billData.meter_rent) || 0,
        total_amount_due: Number(billData.total_amount_due),
        amount_paid: Number(billData.amount_paid) || 0,
    };
    const { data, error } = await supabaseCreateBill(payload);
    if (data && !error) {
        bills = [data, ...bills]; // data is Bill (Row type)
        notifyBillListeners();
        return data;
    }
    console.error("DataStore: Failed to add bill. Supabase error:", error); return null;
};
export const updateExistingBill = async (id: string, billUpdateData: BillUpdate) => { // BillUpdate from supabase.ts
    const payload: BillUpdate = { ...billUpdateData }; // Ensure mapping if DB expects snake_case
    if (payload.previous_reading_value !== undefined) payload.previous_reading_value = Number(payload.previous_reading_value);
    if (payload.current_reading_value !== undefined) payload.current_reading_value = Number(payload.current_reading_value);
    if (payload.base_water_charge !== undefined) payload.base_water_charge = Number(payload.base_water_charge);
    if (payload.total_amount_due !== undefined) payload.total_amount_due = Number(payload.total_amount_due);
    if (payload.amount_paid !== undefined) payload.amount_paid = Number(payload.amount_paid);

    const { data, error } = await supabaseUpdateBill(id, payload);
    if (data && !error) {
        bills = bills.map(b => b.id === id ? data : b); // data is Bill (Row type)
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to update bill. Supabase error:", error);
    }
};
export const removeBill = async (billId: string) => {
    const { error } = await supabaseDeleteBill(billId);
    if (!error) {
        bills = bills.filter(b => b.id !== billId);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to delete bill. Supabase error:", error);
    }
};

// --- Actions for MeterReadings ---
export const addMeterReading = async (readingData: MeterReadingInsert) => { // MeterReadingInsert from supabase.ts
    const payload: MeterReadingInsert = { // Ensure mapping if DB expects snake_case
        ...readingData,
        reading_value: Number(readingData.reading_value),
    };
    const { data, error } = await supabaseCreateMeterReading(payload);
    if (data && !error) {
        meterReadings = [data, ...meterReadings]; // data is MeterReading (Row type)
        notifyMeterReadingListeners();
        return data;
    }
    console.error("DataStore: Failed to add meter reading. Supabase error:", error); return null;
};
export const updateExistingMeterReading = async (id: string, readingUpdateData: MeterReadingUpdate) => { // MeterReadingUpdate
    const payload: MeterReadingUpdate = { ...readingUpdateData }; // Ensure mapping
    if (payload.reading_value !== undefined) payload.reading_value = Number(payload.reading_value);

    const { data, error } = await supabaseUpdateMeterReading(id, payload);
    if (data && !error) {
        meterReadings = meterReadings.map(r => r.id === id ? data : r); // data is MeterReading (Row type)
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to update meter reading. Supabase error:", error);
    }
};
export const removeMeterReading = async (readingId: string) => {
    const { error } = await supabaseDeleteMeterReading(readingId);
    if (!error) {
        meterReadings = meterReadings.filter(r => r.id !== readingId);
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to delete meter reading. Supabase error:", error);
    }
};

// --- Actions for Payments ---
export const addPayment = async (paymentData: PaymentInsert) => { // PaymentInsert from supabase.ts
    const payload: PaymentInsert = { // Ensure mapping
        ...paymentData,
        amount_paid: Number(paymentData.amount_paid),
    };
    const { data, error } = await supabaseCreatePayment(payload);
    if (data && !error) {
        payments = [data, ...payments]; // data is Payment (Row type)
        notifyPaymentListeners();
        return data;
    }
    console.error("DataStore: Failed to add payment. Supabase error:", error); return null;
};
export const updateExistingPayment = async (id: string, paymentUpdateData: PaymentUpdate) => { // PaymentUpdate
    const payload: PaymentUpdate = { ...paymentUpdateData }; // Ensure mapping
    if (payload.amount_paid !== undefined) payload.amount_paid = Number(payload.amount_paid);

    const { data, error } = await supabaseUpdatePayment(id, payload);
    if (data && !error) {
        payments = payments.map(p => p.id === id ? data : p); // data is Payment (Row type)
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to update payment. Supabase error:", error);
    }
};
export const removePayment = async (paymentId: string) => {
    const { error } = await supabaseDeletePayment(paymentId);
    if (!error) {
        payments = payments.filter(p => p.id !== paymentId);
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to delete payment. Supabase error:", error);
    }
};

// --- Actions for ReportLogs ---
export const addReportLog = async (logData: ReportLogInsert) => { // ReportLogInsert from supabase.ts
    const { data, error } = await supabaseCreateReportLog(logData); // Assuming direct match or correct mapping in supabaseCreateReportLog
    if (data && !error) {
        reportLogs = [data, ...reportLogs]; // data is ReportLog (Row type)
        notifyReportLogListeners();
        return data;
    }
    console.error("DataStore: Failed to add report log. Supabase error:", error); return null;
};
export const updateExistingReportLog = async (id: string, logUpdateData: ReportLogUpdate) => { // ReportLogUpdate
    const { data, error } = await supabaseUpdateReportLog(id, logUpdateData); // Assuming direct match
    if (data && !error) {
        reportLogs = reportLogs.map(l => l.id === id ? data : l); // data is ReportLog (Row type)
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to update report log. Supabase error:", error);
    }
};
export const removeReportLog = async (logId: string) => {
    const { error } = await supabaseDeleteReportLog(logId);
    if (!error) {
        reportLogs = reportLogs.filter(l => l.id !== logId);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to delete report log. Supabase error:", error);
    }
};


// --- Subscribe functions ---
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

export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => {
  branchListeners.add(listener);
  if (branchesFetched) listener([...branches]); else initializeBranches().then(() => listener([...branches]));
  return () => branchListeners.delete(listener);
};

export const subscribeToStaffMembers = (listener: Listener<StaffMember>): (() => void) => {
  staffMemberListeners.add(listener);
  if (staffMembersFetched) listener([...staffMembers]); else initializeStaffMembers().then(() => listener([...staffMembers]));
  return () => staffMemberListeners.delete(listener);
};

export const subscribeToBills = (listener: Listener<Bill>): (() => void) => {
    billListeners.add(listener);
    if (billsFetched) listener([...bills]); else initializeBills().then(() => listener([...bills]));
    return () => billListeners.delete(listener);
};
export const subscribeToMeterReadings = (listener: Listener<MeterReading>): (() => void) => {
    meterReadingListeners.add(listener);
    if (meterReadingsFetched) listener([...meterReadings]); else initializeMeterReadings().then(() => listener([...meterReadings]));
    return () => meterReadingListeners.delete(listener);
};
export const subscribeToPayments = (listener: Listener<Payment>): (() => void) => {
    paymentListeners.add(listener);
    if (paymentsFetched) listener([...payments]); else initializePayments().then(() => listener([...payments]));
    return () => paymentListeners.delete(listener);
};
export const subscribeToReportLogs = (listener: Listener<ReportLog>): (() => void) => {
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

    