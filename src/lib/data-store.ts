
import type { IndividualCustomer, CustomerType, SewerageConnection } from '@/app/admin/individual-customers/individual-customer-types';
import { calculateBill } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch } from '@/app/admin/branches/branch-types';
import type { StaffMember } from '@/app/admin/staff-management/staff-types'; // Import StaffMember
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
  getAllStaffMembers as supabaseGetAllStaffMembers, // Import staff functions
  createStaffMember as supabaseCreateStaffMember,
  updateStaffMember as supabaseUpdateStaffMember,
  deleteStaffMember as supabaseDeleteStaffMember,
} from './supabase';

// Local cache state
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let branches: Branch[] = [];
let staffMembers: StaffMember[] = []; // Cache for staff members

// Flags to see if initial fetch has been attempted
let customersFetched = false;
let bulkMetersFetched = false;
let branchesFetched = false;
let staffMembersFetched = false; // Flag for staff members

// Listeners
type Listener<T> = (data: T[]) => void;
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const branchListeners: Set<Listener<Branch>> = new Set();
const staffMemberListeners: Set<Listener<StaffMember>> = new Set(); // Listeners for staff

// Notify functions
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers])); // Notify for staff


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
    customers = data;
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
    bulkMeters = data;
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

// Getters
export const getBranches = (): Branch[] => [...branches];
export const getCustomers = (): IndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getStaffMembers = (): StaffMember[] => [...staffMembers];


// --- Actions for Branches ---
export const addBranch = async (branchData: Omit<Branch, 'id'>) => {
  const { data: newBranch, error } = await supabaseCreateBranch(branchData);
  if (newBranch && !error) {
    branches = [newBranch, ...branches];
    notifyBranchListeners();
    return newBranch;
  }
  console.error("DataStore: Failed to add branch", error);
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
  };

  const { data: newCustomer, error } = await supabaseCreateCustomer(customerPayload);
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
  const usage = updatePayload.currentReading - updatePayload.previousReading;
  updatePayload.calculatedBill = calculateBill(usage, updatePayload.customerType, updatePayload.sewerageConnection);

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
  };
  const { data: newBulkMeter, error } = await supabaseCreateBulkMeter(bulkMeterPayload);
  if (newBulkMeter && !error) {
    bulkMeters = [newBulkMeter, ...bulkMeters];
    notifyBulkMeterListeners();
    return newBulkMeter;
  }
  console.error("DataStore: Failed to add bulk meter", error);
  return null;
};

export const updateBulkMeter = async (updatedBulkMeterData: BulkMeter) => {
  const { id, ...updatePayload } = updatedBulkMeterData;
  const { data: updatedBulkMeter, error } = await supabaseUpdateBulkMeter(id, updatePayload);
  if (updatedBulkMeter && !error) {
    bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to update bulk meter", error);
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
  // Password is included in staffData from StaffFormValues
  const { data: newStaff, error } = await supabaseCreateStaffMember(staffData);
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
  // Password will be updated if present in updatePayload
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

// --- Subscribe functions ---
export const subscribeToCustomers = (listener: Listener<IndividualCustomer>): (() => void) => {
  customerListeners.add(listener);
  fetchAllCustomers().then(() => listener([...customers]));
  return () => customerListeners.delete(listener);
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  fetchAllBulkMeters().then(() => listener([...bulkMeters]));
  return () => bulkMeterListeners.delete(listener);
};

export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => {
  branchListeners.add(listener);
  fetchAllBranches().then(() => listener([...branches]));
  return () => branchListeners.delete(listener);
};

export const subscribeToStaffMembers = (listener: Listener<StaffMember>): (() => void) => {
  staffMemberListeners.add(listener);
  fetchAllStaffMembers().then(() => listener([...staffMembers]));
  return () => staffMemberListeners.delete(listener);
};


// --- Initial data load for the application ---
export async function loadInitialData() {
  await Promise.all([
    fetchAllBranches(),
    fetchAllCustomers(),
    fetchAllBulkMeters(),
    fetchAllStaffMembers(), // Load staff members
  ]);
}
