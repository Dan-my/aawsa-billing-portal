
import type { ReactNode } from 'react';
import type { IndividualCustomer } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch } from '@/app/admin/branches/branch-types';

// State
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let branches: Branch[] = []; // Added branches state

let initialCustomersLoaded = false;
let initialBulkMetersLoaded = false;
let initialBranchesLoaded = false; // Added flag for branches

// Listeners
type Listener<T> = (data: T[]) => void;
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const branchListeners: Set<Listener<Branch>> = new Set(); // Added branch listeners

// Notify functions
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches])); // Added branch notify function

// Initializer functions
export const initializeCustomers = (initialData: IndividualCustomer[]) => {
  if (!initialCustomersLoaded || customers.length === 0) {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      customers = JSON.parse(savedCustomers);
    } else {
      customers = [...initialData];
    }
    initialCustomersLoaded = true;
    notifyCustomerListeners();
  }
};

export const initializeBulkMeters = (initialData: BulkMeter[]) => {
  if (!initialBulkMetersLoaded || bulkMeters.length === 0) {
    const savedBulkMeters = localStorage.getItem('bulkMeters');
    if (savedBulkMeters) {
      bulkMeters = JSON.parse(savedBulkMeters);
    } else {
      bulkMeters = [...initialData];
    }
    initialBulkMetersLoaded = true;
    notifyBulkMeterListeners();
  }
};

export const initializeBranches = (initialData: Branch[]) => { // Added branch initializer
  if (!initialBranchesLoaded || branches.length === 0) {
    const savedBranches = localStorage.getItem('branches');
    if (savedBranches) {
 branches = JSON.parse(savedBranches);
    } else {
 branches = [...initialData];
    }
    initialBranchesLoaded = true;
    notifyBranchListeners();
  }
};


// Getters
export const getCustomers = (): IndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getBranches = (): Branch[] => [...branches]; // Added branch getter

// Actions for Individual Customers
export const addCustomer = (customerData: Omit<IndividualCustomer, 'id'>) => {
  const newCustomer: IndividualCustomer = {
    ...customerData,
    id: `cust_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
    paymentStatus: 'Unpaid', // Default status
  };
  customers = [newCustomer, ...customers];
  localStorage.setItem('customers', JSON.stringify(customers));
  notifyCustomerListeners();
  return newCustomer;
};

export const updateCustomer = (updatedCustomer: IndividualCustomer) => {
  customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
  localStorage.setItem('customers', JSON.stringify(customers));
  notifyCustomerListeners();
};

export const deleteCustomer = (customerId: string) => {
  customers = customers.filter(c => c.id !== customerId);
  notifyCustomerListeners();
};

// Actions for Bulk Meters
export const addBulkMeter = (bulkMeterData: Omit<BulkMeter, 'id'>) => {
   const newBulkMeter: BulkMeter = {
    ...bulkMeterData,
    id: `bm_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
    paymentStatus: 'Unpaid', // Default status
  };
  bulkMeters = [newBulkMeter, ...bulkMeters];
  localStorage.setItem('bulkMeters', JSON.stringify(bulkMeters));
  notifyBulkMeterListeners();
  return newBulkMeter;
};

export const updateBulkMeter = (updatedBulkMeter: BulkMeter) => {
  bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
  notifyBulkMeterListeners();
};

export const deleteBulkMeter = (bulkMeterId: string) => {
  bulkMeters = bulkMeters.filter(bm => bm.id !== bulkMeterId);
  notifyBulkMeterListeners();
};

// Actions for Branches
export const addBranch = (branchData: Omit<Branch, 'id'>) => {
  const newBranch: Branch = {
    ...branchData,
    id: `br_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  branches = [newBranch, ...branches];
  localStorage.setItem('branches', JSON.stringify(branches));
  notifyBranchListeners();
  return newBranch;
};

export const updateBranch = (updatedBranch: Branch) => {
  branches = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
  notifyBranchListeners();
};

export const deleteBranch = (branchId: string) => {
  branches = branches.filter(b => b.id !== branchId);
  notifyBranchListeners();
};


// Subscribe functions
export const subscribeToCustomers = (listener: Listener<IndividualCustomer>): (() => void) => {
  customerListeners.add(listener);
  listener([...customers]); 
  return () => { 
    customerListeners.delete(listener);
  };
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  listener([...bulkMeters]); 
  return () => { 
    bulkMeterListeners.delete(listener);
  };
};

export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => { // Added branch subscription
  branchListeners.add(listener);
  listener([...branches]);
  return () => {
    branchListeners.delete(listener);
  };
};
