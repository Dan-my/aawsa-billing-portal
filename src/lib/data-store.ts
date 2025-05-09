
import type { ReactNode } from 'react';
import type { IndividualCustomer, CustomerType, SewerageConnection } from '@/app/admin/individual-customers/individual-customer-types';
import { calculateBill } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter } from '@/app/admin/bulk-meters/bulk-meter-types';
import type { Branch } from '@/app/admin/branches/branch-types';

// State
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let branches: Branch[] = []; 

let initialCustomersLoaded = false;
let initialBulkMetersLoaded = false;
let initialBranchesLoaded = false; 

// Listeners
type Listener<T> = (data: T[]) => void;
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const branchListeners: Set<Listener<Branch>> = new Set(); 

// Notify functions
const notifyCustomerListeners = () => {
  if (typeof window !== 'undefined') localStorage.setItem('customers', JSON.stringify(customers));
  customerListeners.forEach(listener => listener([...customers]));
}
const notifyBulkMeterListeners = () => {
  if (typeof window !== 'undefined') localStorage.setItem('bulkMeters', JSON.stringify(bulkMeters));
  bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
}
const notifyBranchListeners = () => {
  if (typeof window !== 'undefined') localStorage.setItem('branches', JSON.stringify(branches));
  branchListeners.forEach(listener => listener([...branches])); 
}


// Initializer functions
export const initializeCustomers = (initialData: IndividualCustomer[]) => {
  if (!initialCustomersLoaded || customers.length === 0) {
    if (typeof window !== 'undefined') {
      const savedCustomers = localStorage.getItem('customers');
      if (savedCustomers) {
        customers = JSON.parse(savedCustomers);
      } else {
        customers = [...initialData];
        localStorage.setItem('customers', JSON.stringify(customers));
      }
    } else {
        customers = [...initialData]; // Fallback for non-browser environments or if localStorage fails
    }
    initialCustomersLoaded = true;
    notifyCustomerListeners();
  }
};

export const initializeBulkMeters = (initialData: BulkMeter[]) => {
  if (!initialBulkMetersLoaded || bulkMeters.length === 0) {
     if (typeof window !== 'undefined') {
        const savedBulkMeters = localStorage.getItem('bulkMeters');
        if (savedBulkMeters) {
          bulkMeters = JSON.parse(savedBulkMeters);
        } else {
          bulkMeters = [...initialData];
          localStorage.setItem('bulkMeters', JSON.stringify(bulkMeters));
        }
     } else {
        bulkMeters = [...initialData];
     }
    initialBulkMetersLoaded = true;
    notifyBulkMeterListeners();
  }
};

export const initializeBranches = (initialData: Branch[]) => { 
  if (!initialBranchesLoaded || branches.length === 0) {
    if (typeof window !== 'undefined') {
        const savedBranches = localStorage.getItem('branches');
        if (savedBranches) {
            branches = JSON.parse(savedBranches);
        } else {
            branches = [...initialData];
            localStorage.setItem('branches', JSON.stringify(branches));
        }
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
export const getBranches = (): Branch[] => [...branches]; 

// Actions for Individual Customers
export const addCustomer = (customerData: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection} ) => {
  const usage = customerData.currentReading - customerData.previousReading;
  const calculatedBill = calculateBill(usage, customerData.customerType, customerData.sewerageConnection);

  const newCustomer: IndividualCustomer = {
    ...customerData,
    id: `cust_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
    paymentStatus: 'Unpaid', // Default payment status
    status: 'Active', // Default status
    calculatedBill,
  };
  customers = [newCustomer, ...customers];
  notifyCustomerListeners();
  return newCustomer;
};

export const updateCustomer = (updatedCustomerData: IndividualCustomer) => {
  // Recalculate bill if readings or type changed
  const usage = updatedCustomerData.currentReading - updatedCustomerData.previousReading;
  const recalculatedBill = calculateBill(usage, updatedCustomerData.customerType, updatedCustomerData.sewerageConnection);
  
  const customerWithRecalculatedBill = {
    ...updatedCustomerData,
    calculatedBill: recalculatedBill,
  };

  customers = customers.map(c => c.id === customerWithRecalculatedBill.id ? customerWithRecalculatedBill : c);
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
    // paymentStatus and status should be part of bulkMeterData if they are settable on creation
    // or have defaults here if not.
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
  customers = customers.map(c => {
    if (c.assignedBulkMeterId === bulkMeterId) {
      // Consider how to handle reassignment or marking as unassigned
      return { ...c, assignedBulkMeterId: "" }; 
    }
    return c;
  });
  notifyCustomerListeners(); 
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
  if (initialCustomersLoaded) listener([...customers]); 
  return () => { 
    customerListeners.delete(listener);
  };
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  if (initialBulkMetersLoaded) listener([...bulkMeters]); 
  return () => { 
    bulkMeterListeners.delete(listener);
  };
};

export const subscribeToBranches = (listener: Listener<Branch>): (() => void) => { 
  branchListeners.add(listener);
  if (initialBranchesLoaded) listener([...branches]);
  return () => {
    branchListeners.delete(listener);
  };
};
