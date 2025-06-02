
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
        // Ensure numeric fields are correctly typed from Supabase (which might return strings for NUMERIC)
        meterSize: Number(c.meter_size) || 0,
        previousReading: Number(c.previous_reading) || 0,
        currentReading: Number(c.current_reading) || 0,
        ordinal: Number(c.ordinal) || 0,
        calculatedBill: Number(c.calculated_bill) || 0,
    })) as IndividualCustomer[]; // Cast to ensure type alignment
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
        reportLogs = data; // Assuming ReportLog type doesn't need numeric coercion like others
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
    console.error("DataStore: Failed to update branch", error);
  }
};

export const deleteBranch = async (branchId: string) => {
  const { error } = await supabaseDeleteBranch(branchId); // supabaseDeleteBranch might return { data, error }
  if (!error) {
    branches = branches.filter(b => b.id !== branchId);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to delete branch", error);
  }
};

// --- Actions for Individual Customers ---
export const addCustomer = async (customerData: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection}) => {
  const usage = customerData.currentReading - customerData.previousReading;
  const calculatedBill = calculateBill(usage, customerData.customerType, customerData.sewerageConnection);

  const customerPayload: IndividualCustomerInsert = {
    ...customerData,
    payment_status: 'Unpaid',
    status: 'Active',
    calculated_bill: calculatedBill,
    meter_size: Number(customerData.meterSize) || 0,
    previous_reading: Number(customerData.previousReading) || 0,
    current_reading: Number(customerData.currentReading) || 0,
    ordinal: Number(customerData.ordinal) || 0,
  };

  const { data: newCustomerResult, error } = await supabaseCreateCustomer(customerPayload);
  if (newCustomerResult && !error) {
    const newCustomer: IndividualCustomer = {
        ...newCustomerResult,
        meterSize: Number(newCustomerResult.meter_size),
        previousReading: Number(newCustomerResult.previous_reading),
        currentReading: Number(newCustomerResult.current_reading),
        ordinal: Number(newCustomerResult.ordinal),
        calculatedBill: Number(newCustomerResult.calculated_bill),
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
  const { id, ...updatePayload } = updatedCustomerData;
  const usage = Number(updatePayload.currentReading) - Number(updatePayload.previousReading);
  updatePayload.calculatedBill = calculateBill(usage, updatePayload.customerType, updatePayload.sewerageConnection);

  const updatePayloadSupabase: IndividualCustomerUpdate = {
    ...updatePayload,
    meter_size: Number(updatePayload.meterSize) || 0,
    previous_reading: Number(updatePayload.previousReading) || 0,
    current_reading: Number(updatePayload.currentReading) || 0,
    ordinal: Number(updatePayload.ordinal) || 0,
    calculated_bill: updatePayload.calculatedBill,
  };


  const { data: updatedCustomerResult, error } = await supabaseUpdateCustomer(id, updatePayloadSupabase);
  if (updatedCustomerResult && !error) {
    const updatedCustomer: IndividualCustomer = {
        ...updatedCustomerResult,
        meterSize: Number(updatedCustomerResult.meter_size),
        previousReading: Number(updatedCustomerResult.previous_reading),
        currentReading: Number(updatedCustomerResult.current_reading),
        ordinal: Number(updatedCustomerResult.ordinal),
        calculatedBill: Number(updatedCustomerResult.calculated_bill),
    };
    customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to update customer", error);
  }
};

export const deleteCustomer = async (customerId: string) => {
  const { error } = await supabaseDeleteCustomer(customerId);
  if (!error) {
    customers = customers.filter(c => c.id !== customerId);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to delete customer", error);
  }
};

// --- Actions for Bulk Meters ---
export const addBulkMeter = async (bulkMeterData: Omit<BulkMeter, 'id'>) => {
  const bulkMeterPayload: BulkMeterInsert = {
    ...bulkMeterData,
    payment_status: bulkMeterData.paymentStatus || 'Unpaid',
    status: bulkMeterData.status || 'Active',
    meter_size: Number(bulkMeterData.meterSize) || 0,
    previous_reading: Number(bulkMeterData.previousReading) || 0,
    current_reading: Number(bulkMeterData.currentReading) || 0,
  };
  const { data: newBulkMeterResult, error } = await supabaseCreateBulkMeter(bulkMeterPayload);
  if (newBulkMeterResult && !error) {
    const newBulkMeter: BulkMeter = {
        ...newBulkMeterResult,
        meterSize: Number(newBulkMeterResult.meter_size),
        previousReading: Number(newBulkMeterResult.previous_reading),
        currentReading: Number(newBulkMeterResult.current_reading),
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
  const { id, ...updatePayload } = updatedBulkMeterData;

  const updatePayloadToSend: BulkMeterUpdate = {
    ...updatePayload,
    meter_size: Number(updatedBulkMeterData.meterSize) || 0,
    previous_reading: Number(updatedBulkMeterData.previousReading) || 0,
    current_reading: Number(updatedBulkMeterData.currentReading) || 0,
  };

  const { data: updatedBulkMeterResult, error } = await supabaseUpdateBulkMeter(id, updatePayloadToSend);
  if (updatedBulkMeterResult && !error) {
    const updatedBulkMeter: BulkMeter = {
        ...updatedBulkMeterResult,
        meterSize: Number(updatedBulkMeterResult.meter_size),
        previousReading: Number(updatedBulkMeterResult.previous_reading),
        currentReading: Number(updatedBulkMeterResult.current_reading),
    };
    bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to update bulk meter. Supabase error:", error);
    if (error && typeof error === 'object') {
        const supabaseError = error as any;
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
        if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
        if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
        if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
    }
  }
};

export const deleteBulkMeter = async (bulkMeterId: string) => {
  const { error } = await supabaseDeleteBulkMeter(bulkMeterId);
  if (!error) {
    bulkMeters = bulkMeters.filter(bm => bm.id !== bulkMeterId);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to delete bulk meter", error);
  }
};

// --- Actions for Staff Members ---
export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>) => {
  const { data: newStaff, error } = await supabaseCreateStaffMember(staffData as StaffMemberInsert);
  if (newStaff && !error) {
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
  const { id, ...updatePayload } = updatedStaffData;
  const { data: updatedStaff, error } = await supabaseUpdateStaffMember(id, updatePayload as StaffMemberUpdate);
  if (updatedStaff && !error) {
    staffMembers = staffMembers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to update staff member", error);
  }
};

export const deleteStaffMember = async (staffId: string) => {
  const { error } = await supabaseDeleteStaffMember(staffId);
  if (!error) {
    staffMembers = staffMembers.filter(s => s.id !== staffId);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to delete staff member", error);
  }
};

// --- Actions for Bills ---
export const addBill = async (billData: BillInsert) => {
    const payload: BillInsert = {
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
        bills = [data, ...bills];
        notifyBillListeners();
        return data;
    }
    console.error("DataStore: Failed to add bill", error); return null;
};
export const updateExistingBill = async (id: string, billUpdateData: BillUpdate) => {
    const payload: BillUpdate = { ...billUpdateData };
    if (payload.previous_reading_value !== undefined) payload.previous_reading_value = Number(payload.previous_reading_value);
    if (payload.current_reading_value !== undefined) payload.current_reading_value = Number(payload.current_reading_value);
    if (payload.base_water_charge !== undefined) payload.base_water_charge = Number(payload.base_water_charge);
    if (payload.total_amount_due !== undefined) payload.total_amount_due = Number(payload.total_amount_due);
    if (payload.amount_paid !== undefined) payload.amount_paid = Number(payload.amount_paid);

    const { data, error } = await supabaseUpdateBill(id, payload);
    if (data && !error) {
        bills = bills.map(b => b.id === id ? data : b);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to update bill", error);
    }
};
export const removeBill = async (billId: string) => {
    const { error } = await supabaseDeleteBill(billId);
    if (!error) {
        bills = bills.filter(b => b.id !== billId);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to delete bill", error);
    }
};

// --- Actions for MeterReadings ---
export const addMeterReading = async (readingData: MeterReadingInsert) => {
    const payload: MeterReadingInsert = {
        ...readingData,
        reading_value: Number(readingData.reading_value),
    };
    const { data, error } = await supabaseCreateMeterReading(payload);
    if (data && !error) {
        meterReadings = [data, ...meterReadings];
        notifyMeterReadingListeners();
        return data;
    }
    console.error("DataStore: Failed to add meter reading", error); return null;
};
export const updateExistingMeterReading = async (id: string, readingUpdateData: MeterReadingUpdate) => {
    const payload: MeterReadingUpdate = { ...readingUpdateData };
    if (payload.reading_value !== undefined) payload.reading_value = Number(payload.reading_value);

    const { data, error } = await supabaseUpdateMeterReading(id, payload);
    if (data && !error) {
        meterReadings = meterReadings.map(r => r.id === id ? data : r);
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to update meter reading", error);
    }
};
export const removeMeterReading = async (readingId: string) => {
    const { error } = await supabaseDeleteMeterReading(readingId);
    if (!error) {
        meterReadings = meterReadings.filter(r => r.id !== readingId);
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to delete meter reading", error);
    }
};

// --- Actions for Payments ---
export const addPayment = async (paymentData: PaymentInsert) => {
    const payload: PaymentInsert = {
        ...paymentData,
        amount_paid: Number(paymentData.amount_paid),
    };
    const { data, error } = await supabaseCreatePayment(payload);
    if (data && !error) {
        payments = [data, ...payments];
        notifyPaymentListeners();
        return data;
    }
    console.error("DataStore: Failed to add payment", error); return null;
};
export const updateExistingPayment = async (id: string, paymentUpdateData: PaymentUpdate) => {
    const payload: PaymentUpdate = { ...paymentUpdateData };
    if (payload.amount_paid !== undefined) payload.amount_paid = Number(payload.amount_paid);

    const { data, error } = await supabaseUpdatePayment(id, payload);
    if (data && !error) {
        payments = payments.map(p => p.id === id ? data : p);
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to update payment", error);
    }
};
export const removePayment = async (paymentId: string) => {
    const { error } = await supabaseDeletePayment(paymentId);
    if (!error) {
        payments = payments.filter(p => p.id !== paymentId);
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to delete payment", error);
    }
};

// --- Actions for ReportLogs ---
export const addReportLog = async (logData: ReportLogInsert) => {
    const { data, error } = await supabaseCreateReportLog(logData);
    if (data && !error) {
        reportLogs = [data, ...reportLogs];
        notifyReportLogListeners();
        return data;
    }
    console.error("DataStore: Failed to add report log", error); return null;
};
export const updateExistingReportLog = async (id: string, logUpdateData: ReportLogUpdate) => {
    const { data, error } = await supabaseUpdateReportLog(id, logUpdateData);
    if (data && !error) {
        reportLogs = reportLogs.map(l => l.id === id ? data : l);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to update report log", error);
    }
};
export const removeReportLog = async (logId: string) => {
    const { error } = await supabaseDeleteReportLog(logId);
    if (!error) {
        reportLogs = reportLogs.filter(l => l.id !== logId);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to delete report log", error);
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

    