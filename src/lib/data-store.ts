
import type { ReactNode } from 'react';
import type { IndividualCustomer, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter, BulkMeterStatus } from '@/app/admin/bulk-meters/bulk-meter-types';

// It's better to define initial data here or fetch from a common source
// For now, we'll let the pages provide their initial data if the store is empty.

// State
let customers: IndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let initialCustomersLoaded = false;
let initialBulkMetersLoaded = false;


// Listeners
type Listener<T> = (data: T[]) => void;
const customerListeners: Set<Listener<IndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();

// Notify functions
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));

// Initializer functions
export const initializeCustomers = (initialData: IndividualCustomer[]) => {
  if (!initialCustomersLoaded) {
    customers = [...initialData];
    initialCustomersLoaded = true;
    notifyCustomerListeners();
  }
};

export const initializeBulkMeters = (initialData: BulkMeter[]) => {
  if (!initialBulkMetersLoaded) {
    bulkMeters = [...initialData];
    initialBulkMetersLoaded = true;
    notifyBulkMeterListeners();
  }
};


// Getters
export const getCustomers = (): IndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];

// Actions for Individual Customers
export const addCustomer = (customerData: Omit<IndividualCustomer, 'id' | 'status'> & { status: IndividualCustomerStatus }) => {
  const newCustomer: IndividualCustomer = {
    ...customerData,
    id: Date.now().toString(),
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
export const addBulkMeter = (bulkMeterData: Omit<BulkMeter, 'id' | 'status'> & { status: BulkMeterStatus }) => {
   const newBulkMeter: BulkMeter = {
    ...bulkMeterData,
    id: Date.now().toString(),
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
  notifyBulkMeterListeners();
};

// Subscribe functions
export const subscribeToCustomers = (listener: Listener<IndividualCustomer>): (() => void) => {
  customerListeners.add(listener);
  listener([...customers]); // Immediately notify with current data
  return () => { // Unsubscribe
    customerListeners.delete(listener);
  };
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  listener([...bulkMeters]); // Immediately notify with current data
  return () => { // Unsubscribe
    bulkMeterListeners.delete(listener);
  };
};
