
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
import type { BranchInsert, BulkMeterInsert, IndividualCustomerInsert, StaffMemberInsert, Bill, BillInsert, BillUpdate, MeterReading, MeterReadingInsert, MeterReadingUpdate, Payment, PaymentInsert, PaymentUpdate, ReportLog, ReportLogInsert, ReportLogUpdate } from './supabase';


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
    console.error("DataStore: Failed to fetch branches", error);
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
    console.error("DataStore: Failed to fetch customers", error);
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
    console.error("DataStore: Failed to fetch bulk meters", error);
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
    console.error("DataStore: Failed to fetch staff members", error);
  }
  staffMembersFetched = true;
  return staffMembers;
}

async function fetchAllBills() {
    const { data, error } = await supabaseGetAllBills();
    if (data) {
        bills = data;
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to fetch bills", error);
    }
    billsFetched = true;
    return bills;
}

async function fetchAllMeterReadings() {
    const { data, error } = await supabaseGetAllMeterReadings();
    if (data) {
        meterReadings = data;
        notifyMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch meter readings", error);
    }
    meterReadingsFetched = true;
    return meterReadings;
}

async function fetchAllPayments() {
    const { data, error } = await supabaseGetAllPayments();
    if (data) {
        payments = data;
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to fetch payments", error);
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
        console.error("DataStore: Failed to fetch report logs", error);
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
    const supabaseError = error as any; // Attempt to cast to access potential properties
    if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
    if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
    if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
  }
  return null;
};

export const updateBranch = async (updatedBranchData: Branch) => {
  const { id, ...updatePayload } = updatedBranchData;
  const { data: updatedBranch, error } = await supabaseUpdateBranch(id, updatePayload);
  if (updatedBranch && !error) {
    branches = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to update branch", error);
  }
};

export const deleteBranch = async (branchId: string) => {
  const { data, error } = await supabaseDeleteBranch(branchId);
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

  const customerPayload: Omit<IndividualCustomer, 'id'> = {
    ...customerData,
    paymentStatus: 'Unpaid',
    status: 'Active',
    calculatedBill,
    meterSize: Number(customerData.meterSize) || 0,
    previousReading: Number(customerData.previousReading) || 0,
    currentReading: Number(customerData.currentReading) || 0,
    ordinal: Number(customerData.ordinal) || 0,
  };

  const { data: newCustomer, error } = await supabaseCreateCustomer(customerPayload as IndividualCustomerInsert);
  if (newCustomer && !error) {
    customers = [newCustomer, ...customers];
    notifyCustomerListeners();
    return newCustomer;
  }
  console.error("DataStore: Failed to add customer", error);
  return null;
};

export const updateCustomer = async (updatedCustomerData: IndividualCustomer) => {
  const { id, ...updatePayload } = updatedCustomerData;
  const usage = Number(updatePayload.currentReading) - Number(updatePayload.previousReading);
  updatePayload.calculatedBill = calculateBill(usage, updatePayload.customerType, updatePayload.sewerageConnection);

  updatePayload.meterSize = Number(updatePayload.meterSize) || 0;
  updatePayload.previousReading = Number(updatePayload.previousReading) || 0;
  updatePayload.currentReading = Number(updatePayload.currentReading) || 0;
  updatePayload.ordinal = Number(updatePayload.ordinal) || 0;


  const { data: updatedCustomer, error } = await supabaseUpdateCustomer(id, updatePayload);
  if (updatedCustomer && !error) {
    customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to update customer", error);
  }
};

export const deleteCustomer = async (customerId: string) => {
  const { data, error } = await supabaseDeleteCustomer(customerId);
  if (!error) {
    customers = customers.filter(c => c.id !== customerId);
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to delete customer", error);
  }
};

// --- Actions for Bulk Meters ---
export const addBulkMeter = async (bulkMeterData: Omit<BulkMeter, 'id'>) => {
  const bulkMeterPayload: Omit<BulkMeter, 'id'> = {
    ...bulkMeterData,
    paymentStatus: bulkMeterData.paymentStatus || 'Unpaid',
    status: bulkMeterData.status || 'Active',
    meterSize: Number(bulkMeterData.meterSize) || 0,
    previousReading: Number(bulkMeterData.previousReading) || 0,
    currentReading: Number(bulkMeterData.currentReading) || 0,
  };
  const { data: newBulkMeter, error } = await supabaseCreateBulkMeter(bulkMeterPayload as BulkMeterInsert);
  if (newBulkMeter && !error) {
    bulkMeters = [newBulkMeter, ...bulkMeters];
    notifyBulkMeterListeners();
    return newBulkMeter;
  }
  console.error("DataStore: Failed to add bulk meter", error);
  return null;
};

export const updateBulkMeter = async (updatedBulkMeterData: BulkMeter) => {
  const { id, ...updatePayloadToSend } = updatedBulkMeterData;

  (updatePayloadToSend as any).meterSize = Number(updatedBulkMeterData.meterSize) || 0;
  (updatePayloadToSend as any).previousReading = Number(updatedBulkMeterData.previousReading) || 0;
  (updatePayloadToSend as any).currentReading = Number(updatedBulkMeterData.currentReading) || 0;

  const { data: updatedBulkMeter, error } = await supabaseUpdateBulkMeter(id, updatePayloadToSend);
  if (updatedBulkMeter && !error) {
    bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to update bulk meter. Supabase error:", error);
    if (error && typeof error === 'object') {
        console.error("Error details (JSON):", JSON.stringify(error, null, 2));
        const supabaseError = error as any;
        if (supabaseError.message) console.error("Supabase message:", supabaseError.message);
        if (supabaseError.details) console.error("Supabase details:", supabaseError.details);
        if (supabaseError.hint) console.error("Supabase hint:", supabaseError.hint);
        if (supabaseError.code) console.error("Supabase code:", supabaseError.code);
    }
  }
};

export const deleteBulkMeter = async (bulkMeterId: string) => {
  const { data, error } = await supabaseDeleteBulkMeter(bulkMeterId);
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
  console.error("DataStore: Failed to add staff member", error);
  return null;
};

export const updateStaffMember = async (updatedStaffData: StaffMember) => {
  const { id, ...updatePayload } = updatedStaffData;
  const { data: updatedStaff, error } = await supabaseUpdateStaffMember(id, updatePayload);
  if (updatedStaff && !error) {
    staffMembers = staffMembers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to update staff member", error);
  }
};

export const deleteStaffMember = async (staffId: string) => {
  const { data, error } = await supabaseDeleteStaffMember(staffId);
  if (!error) {
    staffMembers = staffMembers.filter(s => s.id !== staffId);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to delete staff member", error);
  }
};

// --- Actions for Bills ---
export const addBill = async (billData: BillInsert) => {
    const { data, error } = await supabaseCreateBill(billData);
    if (data && !error) {
        bills = [data, ...bills];
        notifyBillListeners();
        return data;
    }
    console.error("DataStore: Failed to add bill", error); return null;
};
export const updateExistingBill = async (id: string, billUpdateData: BillUpdate) => {
    const { data, error } = await supabaseUpdateBill(id, billUpdateData);
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
    const { data, error } = await supabaseCreateMeterReading(readingData);
    if (data && !error) {
        meterReadings = [data, ...meterReadings];
        notifyMeterReadingListeners();
        return data;
    }
    console.error("DataStore: Failed to add meter reading", error); return null;
};
export const updateExistingMeterReading = async (id: string, readingUpdateData: MeterReadingUpdate) => {
    const { data, error } = await supabaseUpdateMeterReading(id, readingUpdateData);
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
    const { data, error } = await supabaseCreatePayment(paymentData);
    if (data && !error) {
        payments = [data, ...payments];
        notifyPaymentListeners();
        return data;
    }
    console.error("DataStore: Failed to add payment", error); return null;
};
export const updateExistingPayment = async (id: string, paymentUpdateData: PaymentUpdate) => {
    const { data, error } = await supabaseUpdatePayment(id, paymentUpdateData);
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
  if (customersFetched) listener([...customers]); else fetchAllCustomers();
  return () => customerListeners.delete(listener);
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  if (bulkMetersFetched) listener([...bulkMeters]); else fetchAllBulkMeters();
  return () => bulkMeterListeners.delete(listener);
};

export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => {
  branchListeners.add(listener);
  if (branchesFetched) listener([...branches]); else fetchAllBranches();
  return () => branchListeners.delete(listener);
};

export const subscribeToStaffMembers = (listener: Listener<StaffMember>): (() => void) => {
  staffMemberListeners.add(listener);
  if (staffMembersFetched) listener([...staffMembers]); else fetchAllStaffMembers();
  return () => staffMemberListeners.delete(listener);
};

export const subscribeToBills = (listener: Listener<Bill>): (() => void) => {
    billListeners.add(listener);
    if (billsFetched) listener([...bills]); else fetchAllBills();
    return () => billListeners.delete(listener);
};
export const subscribeToMeterReadings = (listener: Listener<MeterReading>): (() => void) => {
    meterReadingListeners.add(listener);
    if (meterReadingsFetched) listener([...meterReadings]); else fetchAllMeterReadings();
    return () => meterReadingListeners.delete(listener);
};
export const subscribeToPayments = (listener: Listener<Payment>): (() => void) => {
    paymentListeners.add(listener);
    if (paymentsFetched) listener([...payments]); else fetchAllPayments();
    return () => paymentListeners.delete(listener);
};
export const subscribeToReportLogs = (listener: Listener<ReportLog>): (() => void) => {
    reportLogListeners.add(listener);
    if (reportLogsFetched) listener([...reportLogs]); else fetchAllReportLogs();
    return () => reportLogListeners.delete(listener);
};


// --- Initial data load for the application ---
export async function loadInitialData() {
  await Promise.all([
    fetchAllBranches(),
    fetchAllCustomers(),
    fetchAllBulkMeters(),
    fetchAllStaffMembers(),
    fetchAllBills(),
    fetchAllMeterReadings(),
    fetchAllPayments(),
    fetchAllReportLogs(),
  ]);
}


    