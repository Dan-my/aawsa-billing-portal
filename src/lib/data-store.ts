
import type { IndividualCustomer, CustomerType, SewerageConnection } from '@/app/admin/individual-customers/individual-customer-types';
import { calculateBill } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch } from '@/app/admin/branches/branch-types';
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
} from './supabase';

// Local cache state
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let branches: Branch[] = [];

// Flags to see if initial fetch has been attempted
let customersFetched = false;
let bulkMetersFetched = false;
let branchesFetched = false;

// Listeners
type Listener<T> = (data: T[]) => void;
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const branchListeners: Set<Listener<Branch>> = new Set();

// Notify functions
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));


// --- Initialization and Data Fetching ---
// These functions are now for explicit data fetching, not for localStorage initialization.
// Components should call these or the getters which in turn call these.

async function fetchAllBranches() {
  const { data, error } = await supabaseGetAllBranches();
  if (data) {
    branches = data;
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to fetch branches", error);
    // branches will remain empty or stale, listeners won't be spammed
  }
  branchesFetched = true; // Mark as fetched even if error, to avoid refetch loops by simple getters
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

// --- Initializer functions (Legacy - to be called by components if needed, or getters will lazy load) ---
// These are kept for now if existing components call them, but ideally, components would manage their own data needs.
export const initializeBranches = async (initialData?: Branch[]) => {
  if (!branchesFetched || branches.length === 0) { // Fetch if not fetched or empty
    await fetchAllBranches();
  }
  // initialData from props is now ignored if using Supabase as source of truth
};

export const initializeCustomers = async (initialData?: IndividualCustomer[]) => {
  if (!customersFetched || customers.length === 0) {
    await fetchAllCustomers();
  }
};

export const initializeBulkMeters = async (initialData?: BulkMeter[]) => {
  if (!bulkMetersFetched || bulkMeters.length === 0) {
    await fetchAllBulkMeters();
  }
};


// Getters - now potentially fetching if cache is empty / not yet fetched
export const getBranches = (): Branch[] => {
  // if (!branchesFetched) fetchAllBranches(); // Simple lazy load, might cause issues in React rendering
  return [...branches];
};
export const getCustomers = (): IndividualCustomer[] => {
  // if (!customersFetched) fetchAllCustomers();
  return [...customers];
};
export const getBulkMeters = (): BulkMeter[] => {
  // if (!bulkMetersFetched) fetchAllBulkMeters();
  return [...bulkMeters];
};

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
    paymentStatus: 'Unpaid', // Default payment status
    status: 'Active',       // Default status
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
  // Recalculate bill before sending to Supabase if relevant fields changed
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
    // Optionally, update related customers if assignedBulkMeterId needs clearing.
    // This might be better handled by database constraints (ON DELETE SET NULL) or specific business logic.
    // For now, just removing the bulk meter from the local cache.
    // customers = customers.map(c => c.assignedBulkMeterId === bulkMeterId ? { ...c, assignedBulkMeterId: "" } : c);
    // notifyCustomerListeners(); // If customers are modified
    notifyBulkMeterListeners();
  } else {
    console.error("DataStore: Failed to delete bulk meter", error);
  }
};

// --- Subscribe functions ---
// These remain largely the same, but now depend on explicit fetch calls to populate initial data.
export const subscribeToCustomers = (listener: Listener<IndividualCustomer>): (() => void) => {
  customerListeners.add(listener);
  // if (customersFetched) listener([...customers]); // Send current cache if already fetched
  fetchAllCustomers().then(() => listener([...customers])); // Fetch and then send
  return () => customerListeners.delete(listener);
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  // if (bulkMetersFetched) listener([...bulkMeters]);
  fetchAllBulkMeters().then(() => listener([...bulkMeters]));
  return () => bulkMeterListeners.delete(listener);
};

export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => {
  branchListeners.add(listener);
  // if (branchesFetched) listener([...branches]);
  fetchAllBranches().then(() => listener([...branches]));
  return () => branchListeners.delete(listener);
};

// --- Initial data load for the application ---
// Call this early in your application, e.g., in a top-level layout or provider.
// Or, allow components to trigger fetches via getters or specific fetch functions.
export async function loadInitialData() {
  await Promise.all([
    fetchAllBranches(),
    fetchAllCustomers(),
    fetchAllBulkMeters(),
  ]);
}
