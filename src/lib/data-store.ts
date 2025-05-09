
import type { ReactNode } from 'react';
import type { IndividualCustomer, CustomerType } from '@/app/admin/individual-customers/individual-customer-types';
import { getTariffRate } from '@/app/admin/individual-customers/individual-customer-types';
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
const notifyCustomerListeners = () => {
  localStorage.setItem('customers', JSON.stringify(customers));
  customerListeners.forEach(listener => listener([...customers]));
}
const notifyBulkMeterListeners = () => {
  localStorage.setItem('bulkMeters', JSON.stringify(bulkMeters));
  bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
}
const notifyBranchListeners = () => {
  localStorage.setItem('branches', JSON.stringify(branches));
  branchListeners.forEach(listener => listener([...branches])); // Added branch notify function
}


// Initializer functions
export const initializeCustomers = (initialData: IndividualCustomer[]) => {
  if (!initialCustomersLoaded || customers.length === 0) {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      customers = JSON.parse(savedCustomers);
    } else {
      customers = [...initialData];
      localStorage.setItem('customers', JSON.stringify(customers));
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
      localStorage.setItem('bulkMeters', JSON.stringify(bulkMeters));
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
 localStorage.setItem('branches', JSON.stringify(branches));
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
export const addCustomer = (customerData: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus'> & { customerType: CustomerType, currentReading: number, previousReading: number} ) => {
  const usage = customerData.currentReading - customerData.previousReading;
  const tariff = getTariffRate(customerData.customerType);
  const calculatedBill = usage * tariff;

  const newCustomer: IndividualCustomer = {
    ...customerData,
    id: `cust_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
    paymentStatus: 'Unpaid', // Default status
    calculatedBill,
    status: 'Active', // Default status
  };
  customers = [newCustomer, ...customers];
  notifyCustomerListeners();
  return newCustomer;
};

export const updateCustomer = (updatedCustomer: IndividualCustomer) => {
  customers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
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
    paymentStatus: bulkMeterData.paymentStatus || 'Unpaid', 
    status: bulkMeterData.status || 'Active',
  };
  bulkMeters = [newBulkMeter, ...bulkMeters];
  notifyBulkMeterListeners();
  return newBulkMeter;
};

export const updateBulkMeter = (updatedBulkMeter: BulkMeter) => {
  bulkMeters = bulkMeters.map(bm => bm.id === updatedBulkMeter.id ? updatedBulkMeter : bm);
  notifyBulkMeterListeners();
};

export const deleteBulkMeter = (bulkMeterId: string) => {
  bulkMeters = bulkMeters.filter(bm => bm.id !== bulkMeterId);
  // Also unassign this bulk meter from any customers
  customers = customers.map(c => {
    if (c.assignedBulkMeterId === bulkMeterId) {
      return { ...c, assignedBulkMeterId: "" }; // Or some other placeholder indicating unassigned
    }
    return c;
  });
  notifyCustomerListeners(); // Notify customer changes too
  notifyBulkMeterListeners();
};

// Actions for Branches
export const addBranch = (branchData: Omit<Branch, 'id'>) => {
  const newBranch: Branch = {
    ...branchData,
    id: `br_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  branches = [newBranch, ...branches];
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
