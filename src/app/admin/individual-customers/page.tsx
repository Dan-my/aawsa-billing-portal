"use client";

import * as React from "react";
import { PlusCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { IndividualCustomer } from "./individual-customer-types";
import { TARIFF_RATE } from "./individual-customer-types"; 
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "./individual-customer-form-dialog"; // Import IndividualCustomerFormValues
import { IndividualCustomerTable } from "./individual-customer-table";
import { 
  getCustomers, 
  addCustomer as addCustomerToStore, 
  updateCustomer as updateCustomerInStore, 
  deleteCustomer as deleteCustomerFromStore,
  subscribeToCustomers,
  initializeCustomers,
  getBulkMeters,
  subscribeToBulkMeters,
  initializeBulkMeters,
} from "@/lib/data-store";
// import type { BulkMeter } from "../bulk-meters/bulk-meter-types"; // Not directly used here, but good for context
import { initialBulkMeters as defaultInitialBulkMeters } from "../bulk-meters/page";
// The local initialCustomers is now the default, we'll rename the import for clarity if needed, or ensure it aligns.
// For this example, we assume 'initialCustomers' defined here is the one to use for initialization.

export const initialCustomers: IndividualCustomer[] = [
  { id: "cust001", name: "Abebe Bikila", customerKeyNumber: "CUST001", contractNumber: "CON001", customerType: "Domestic", bookNumber: "B001", ordinal: 1, meterSize: 0.5, meterNumber: "MTR001", previousReading: 100, currentReading: 120, month: "2023-11", specificArea: "Kebele 1, House 101", location: "Bole", ward: "Woreda 3", sewerageConnection: "Yes", status: "Active", assignedBulkMeterId: "bm001", paymentStatus: "Paid", calculatedBill: (120-100) * TARIFF_RATE },
  { id: "cust002", name: "Fatuma Roba", customerKeyNumber: "CUST002", contractNumber: "CON002", customerType: "Domestic", bookNumber: "B001", ordinal: 2, meterSize: 0.5, meterNumber: "MTR002", previousReading: 200, currentReading: 250, month: "2023-11", specificArea: "Kebele 2, House 202", location: "Kality", ward: "Woreda 5", sewerageConnection: "No", status: "Active", assignedBulkMeterId: "bm002", paymentStatus: "Unpaid", calculatedBill: (250-200) * TARIFF_RATE }, 
  { id: "cust003", name: "Haile Gebrselassie", customerKeyNumber: "CUST003", contractNumber: "CON003", customerType: "Non-domestic", bookNumber: "B002", ordinal: 1, meterSize: 1, meterNumber: "MTR003", previousReading: 500, currentReading: 600, month: "2023-11", specificArea: "Industrial Area, Plot 3", location: "Megenagna", ward: "Woreda 7", sewerageConnection: "Yes", status: "Inactive", assignedBulkMeterId: "bm003", paymentStatus: "Paid", calculatedBill: (600-500) * TARIFF_RATE},
];


export default function IndividualCustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>(getCustomers());
  const [bulkMetersList, setBulkMetersList] = React.useState<{id: string, name: string}[]>(getBulkMeters().map(bm => ({id: bm.id, name: bm.name })));
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);

  React.useEffect(() => {
    if (getBulkMeters().length === 0) {
      initializeBulkMeters(defaultInitialBulkMeters);
    }
    const unsubscribeBulkMeters = subscribeToBulkMeters((updatedBulkMeters) => {
      setBulkMetersList(updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
    });

    if (getCustomers().length === 0) {
       initializeCustomers(initialCustomers); // Use the locally defined initialCustomers
    }
    const unsubscribeCustomers = subscribeToCustomers(setCustomers);
    
    return () => {
      unsubscribeCustomers();
      unsubscribeBulkMeters();
    };
  }, []);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: IndividualCustomer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customer: IndividualCustomer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomerFromStore(customerToDelete.id);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitCustomer = (data: IndividualCustomerFormValues) => {
    const usage = data.currentReading - data.previousReading;
    const calculatedBill = usage * TARIFF_RATE;
    
    if (selectedCustomer) { 
      const updatedCustomerData: IndividualCustomer = { 
        id: selectedCustomer.id, // Keep original ID
        ...data, // Spread form values
        calculatedBill,
      };
      updateCustomerInStore(updatedCustomerData);
      toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
    } else {
      // For new customer
      const newCustomerData: Omit<IndividualCustomer, 'id'> = {
        ...data, // Spread form values
        calculatedBill,
      };
      addCustomerToStore(newCustomerData); 
      toast({ title: "Customer Added", description: `${data.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerKeyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Individual Customers Management</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddCustomer}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>View, edit, and manage individual customer information.</CardDescription>
        </CardHeader>
        <CardContent>
           {customers.length === 0 && !searchTerm ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No customers found. Click "Add New Customer" to get started. <User className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : (
            <IndividualCustomerTable
              data={filteredCustomers}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              bulkMetersList={bulkMetersList}
            />
          )}
        </CardContent>
      </Card>

      <IndividualCustomerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitCustomer}
        defaultValues={selectedCustomer}
        bulkMeters={bulkMetersList}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer {customerToDelete?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

