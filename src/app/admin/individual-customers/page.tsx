
"use client";

import * as React from "react";
import { PlusCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { IndividualCustomer, IndividualCustomerStatus } from "./individual-customer-types";
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

// Initial data updated to reflect new, simpler schema
export const initialCustomers: IndividualCustomer[] = [
  { id: "cust001", name: "Abebe Bikila", ordinal: 1, month: "2023-11", location: "Bole", ward: "Woreda 3", status: "Active", assignedBulkMeterId: "bm001", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "cust002", name: "Fatuma Roba", ordinal: 2, month: "2023-11", location: "Kality", ward: "Woreda 5", status: "Active", assignedBulkMeterId: "bm002", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "cust003", name: "Haile Gebrselassie", ordinal: 1, month: "2023-11", location: "Megenagna", ward: "Woreda 7", status: "Inactive", assignedBulkMeterId: "bm003", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
      initializeBulkMeters(),
      initializeCustomers()
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
       setIsLoading(false); 
    });
    
    return () => {
      unsubscribeCustomers();
      unsubscribeBulkMeters();
    };
  }, []);

  const handleAddCustomer = () => {
    if (bulkMetersList.length === 0 && !isLoading) {
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
    if (selectedCustomer) { 
      const updatedCustomerData: IndividualCustomer = { 
        id: selectedCustomer.id, 
        name: data.name,
        ordinal: data.ordinal,
        month: data.month,
        location: data.location,
        ward: data.ward,
        assignedBulkMeterId: data.assignedBulkMeterId,
        status: data.status as IndividualCustomerStatus,
        // created_at and updated_at are managed by DB or data-store
      };
      await updateCustomerInStore(updatedCustomerData);
      toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
    } else {
      const newCustomerData = {
        name: data.name,
        ordinal: data.ordinal,
        month: data.month,
        location: data.location,
        ward: data.ward,
        assignedBulkMeterId: data.assignedBulkMeterId,
        // status is handled by addCustomerToStore (defaults to Active)
      } as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status'>;
      await addCustomerToStore(newCustomerData); 
      toast({ title: "Customer Added", description: `${data.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.assignedBulkMeterId && getBulkMeters().find(bm => bm.id === customer.assignedBulkMeterId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
