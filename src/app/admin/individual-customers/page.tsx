

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
  getBranches,
  initializeBranches,
  subscribeToBranches
} from "@/lib/data-store";
import type { PaymentStatus, CustomerType, SewerageConnection } from "@/lib/billing";
import type { Branch } from "../branches/branch-types";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import type { StaffMember } from "../staff-management/staff-types";

export default function IndividualCustomersPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<StaffMember | null>(null);
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [bulkMetersList, setBulkMetersList] = React.useState<{customerKeyNumber: string, name: string}[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  React.useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }

    setIsLoading(true);
    Promise.all([
      initializeBulkMeters(),
      initializeCustomers(),
      initializeBranches()
    ]).then(() => {
      setBulkMetersList(getBulkMeters().map(bm => ({customerKeyNumber: bm.customerKeyNumber, name: bm.name })));
      setCustomers(getCustomers());
      setBranches(getBranches());
      setIsLoading(false);
    });

    const unsubscribeBulkMeters = subscribeToBulkMeters((updatedBulkMeters) => {
      setBulkMetersList(updatedBulkMeters.map(bm => ({ customerKeyNumber: bm.customerKeyNumber, name: bm.name })));
    });
    const unsubscribeCustomers = subscribeToCustomers((updatedCustomers) => {
       setCustomers(updatedCustomers);
    });
    const unsubscribeBranches = subscribeToBranches((updatedBranches) => {
      setBranches(updatedBranches);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeBulkMeters();
      unsubscribeBranches();
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

  const confirmDelete = async () => {
    if (customerToDelete) {
      const result = await deleteCustomerFromStore(customerToDelete.customerKeyNumber);
      if (result.success) {
        toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      } else {
        toast({ variant: "destructive", title: "Delete Failed", description: result.message || "Could not delete customer."});
      }
      setCustomerToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitCustomer = async (data: IndividualCustomerFormValues) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'User information not found.' });
        return;
    }
    
    if (selectedCustomer) {
      const updatedCustomerData: Partial<Omit<IndividualCustomer, 'customerKeyNumber'>> = {
        ...data, 
        ordinal: Number(data.ordinal),
        meterSize: Number(data.meterSize),
        previousReading: Number(data.previousReading),
        currentReading: Number(data.currentReading),
        status: data.status as IndividualCustomerStatus,
        paymentStatus: data.paymentStatus as PaymentStatus,
        customerType: data.customerType as CustomerType,
        sewerageConnection: data.sewerageConnection as SewerageConnection,
        assignedBulkMeterId: data.assignedBulkMeterId || undefined,
      };
      const result = await updateCustomerInStore(selectedCustomer.customerKeyNumber, updatedCustomerData);
      if (result.success) {
        toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
      } else {
         toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.message || "Could not update the customer.",
        });
      }
    } else {
      const newCustomerData = {
        ...data,
        ordinal: Number(data.ordinal),
        meterSize: Number(data.meterSize),
        previousReading: Number(data.previousReading),
        currentReading: Number(data.currentReading),
      } as Omit<IndividualCustomer, 'created_at' | 'updated_at' | 'calculatedBill'>;

      const result = await addCustomerToStore(newCustomerData, currentUser);
      if (result.success && result.data) {
        toast({ title: "Customer Added", description: `${result.data.name} has been added.` });
      } else {
        toast({ variant: "destructive", title: "Add Failed", description: result.message || "Could not add customer."});
      }
    }
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };
  
  const getBranchNameFromList = (branchId?: string, fallbackLocation?: string) => {
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      if (branch) return branch.name;
    }
    return fallbackLocation || "";
  };

  const filteredCustomers = customers.filter(customer => {
    if (customer.status !== 'Active') return false;
    const branchName = getBranchNameFromList(customer.branchId, customer.location);
    return (
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.assignedBulkMeterId && bulkMetersList.find(bm => bm.customerKeyNumber === customer.assignedBulkMeterId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Individual Customers Management</h1>
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
          {hasPermission('customers_create') && (
            <Button onClick={handleAddCustomer}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Active Customer List</CardTitle>
          <CardDescription>View, edit, and manage active individual customer information.</CardDescription>
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
              data={paginatedCustomers}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              bulkMetersList={bulkMetersList}
              branches={branches}
              canEdit={hasPermission('customers_update')}
              canDelete={hasPermission('customers_delete')}
            />
          )}
        </CardContent>
        {filteredCustomers.length > 0 && (
          <TablePagination
            count={filteredCustomers.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </Card>

      {(hasPermission('customers_create') || hasPermission('customers_update')) && (
        <IndividualCustomerFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitCustomer}
          defaultValues={selectedCustomer}
          bulkMeters={bulkMetersList}
        />
      )}

      {hasPermission('customers_delete') && (
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
      )}
    </div>
  );
}
