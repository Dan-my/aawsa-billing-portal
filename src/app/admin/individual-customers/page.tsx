
"use client";

import * as React from "react";
import { PlusCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { IndividualCustomer, CustomerType, SewerageConnection } from "./individual-customer-types";
import { calculateBill } from "./individual-customer-types"; 
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "./individual-customer-form-dialog";
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
// initialBulkMeters from page is no longer the primary source for bulk meters if store uses Supabase.
// import { initialBulkMeters as defaultInitialBulkMeters } from "../bulk-meters/page";

export const initialCustomers: IndividualCustomer[] = [
  { id: "cust001", name: "Abebe Bikila", customerKeyNumber: "CUST001", contractNumber: "CON001", customerType: "Domestic", bookNumber: "B001", ordinal: 1, meterSize: 0.5, meterNumber: "MTR001", previousReading: 100, currentReading: 120, month: "2023-11", specificArea: "Kebele 1, House 101", location: "Bole", ward: "Woreda 3", sewerageConnection: "Yes", status: "Active", assignedBulkMeterId: "bm001", paymentStatus: "Paid", calculatedBill: calculateBill(120-100, "Domestic", "Yes") },
  { id: "cust002", name: "Fatuma Roba", customerKeyNumber: "CUST002", contractNumber: "CON002", customerType: "Domestic", bookNumber: "B001", ordinal: 2, meterSize: 0.5, meterNumber: "MTR002", previousReading: 200, currentReading: 250, month: "2023-11", specificArea: "Kebele 2, House 202", location: "Kality", ward: "Woreda 5", sewerageConnection: "No", status: "Active", assignedBulkMeterId: "bm002", paymentStatus: "Unpaid", calculatedBill: calculateBill(250-200, "Domestic", "No") }, 
  { id: "cust003", name: "Haile Gebrselassie", customerKeyNumber: "CUST003", contractNumber: "CON003", customerType: "Non-domestic", bookNumber: "B002", ordinal: 1, meterSize: 1, meterNumber: "MTR003", previousReading: 500, currentReading: 600, month: "2023-11", specificArea: "Industrial Area, Plot 3", location: "Megenagna", ward: "Woreda 7", sewerageConnection: "Yes", status: "Inactive", assignedBulkMeterId: "bm003", paymentStatus: "Paid", calculatedBill: calculateBill(600-500, "Non-domestic", "Yes")},
];


export default function IndividualCustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [bulkMetersList, setBulkMetersList] = React.useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    Promise.all([
      initializeBulkMeters(), // Fetches from Supabase if cache empty
      initializeCustomers()  // Fetches from Supabase if cache empty
    ]).then(() => {
      setBulkMetersList(getBulkMeters().map(bm => ({id: bm.id, name: bm.name })));
      setCustomers(getCustomers());
      setIsLoading(false);
    });

    const unsubscribeBulkMeters = subscribeToBulkMeters((updatedBulkMeters) => {
      setBulkMetersList(updatedBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
    });
    const unsubscribeCustomers = subscribeToCustomers((updatedCustomers) => {
       setCustomers(updatedCustomers);
       // Potentially set isLoading to false here too if this is the primary data source
       setIsLoading(false); 
    });
    
    return () => {
      unsubscribeCustomers();
      unsubscribeBulkMeters();
    };
  }, []);

  const handleAddCustomer = () => {
    if (bulkMetersList.length === 0 && !isLoading) { // Check isLoading to avoid premature toast
        toast({
            variant: "destructive",
            title: "No Bulk Meters Available",
            description: "Please add or wait for bulk meters to load before adding individual customers.",
        });
        return;
    }
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

  const confirmDelete = async () => {
    if (customerToDelete) {
      await deleteCustomerFromStore(customerToDelete.id);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitCustomer = async (data: IndividualCustomerFormValues) => {
    const usage = data.currentReading - data.previousReading;
    const calculatedBill = calculateBill(usage, data.customerType as CustomerType, data.sewerageConnection as SewerageConnection);
    
    if (selectedCustomer) { 
      const updatedCustomerData: IndividualCustomer = { 
        id: selectedCustomer.id, 
        ...data, 
        calculatedBill,
      };
      await updateCustomerInStore(updatedCustomerData);
      toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
    } else {
      // Ensure all required fields for Omit<IndividualCustomer, 'id' | 'calculatedBill' ...> are present from data
      const newCustomerData = {
        ...data,
        // id, calculatedBill, paymentStatus, status are handled by addCustomerToStore or Supabase
      } as Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection};
      await addCustomerToStore(newCustomerData); 
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
          <Button onClick={handleAddCustomer} disabled={isLoading && bulkMetersList.length === 0}>
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
           {isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading customers...
             </div>
           ) : customers.length === 0 && !searchTerm ? (
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
