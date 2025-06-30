
"use client";

import * as React from "react";
import { PlusCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { IndividualCustomer, IndividualCustomerStatus } from "@/app/admin/individual-customers/individual-customer-types";
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "@/app/admin/individual-customers/individual-customer-form-dialog";
import { IndividualCustomerTable } from "@/app/admin/individual-customers/individual-customer-table";
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
import type { Branch } from "@/app/admin/branches/branch-types";
import { TablePagination } from "@/components/ui/table-pagination";

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffIndividualCustomersPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [staffBranchName, setStaffBranchName] = React.useState<string | null>(null);

  const [allCustomers, setAllCustomers] = React.useState<IndividualCustomer[]>([]);
  const [allBulkMeters, setAllBulkMeters] = React.useState<{id: string, name: string}[]>([]);
  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  React.useEffect(() => {
    let isMounted = true;

    async function initialize() {
      // 1. Auth Check
      const userString = localStorage.getItem("user");
      if (userString) {
        try {
          const parsedUser: User = JSON.parse(userString);
          if (parsedUser.role === 'staff' && parsedUser.branchName && isMounted) {
            setStaffBranchName(parsedUser.branchName);
          }
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }

      // 2. Initial Data Load
      await Promise.all([
        initializeCustomers(),
        initializeBulkMeters(),
        initializeBranches(),
      ]);

      if (!isMounted) return;

      // 3. Initial state hydration from store
      setAllCustomers(getCustomers());
      setAllBulkMeters(getBulkMeters().map(bm => ({ id: bm.id, name: bm.name })));
      setAllBranches(getBranches());
      
      // 4. Setup subscriptions to live updates
      const unSubCustomers = subscribeToCustomers(setAllCustomers);
      const unSubBulkMeters = subscribeToBulkMeters((bms) => setAllBulkMeters(bms.map(bm => ({ id: bm.id, name: bm.name }))));
      const unSubBranches = subscribeToBranches(setAllBranches);

      // 5. Finalize loading
      setIsLoading(false);

      // 6. Cleanup
      return () => {
        isMounted = false;
        unSubCustomers();
        unSubBulkMeters();
        unSubBranches();
      };
    }

    const cleanupPromise = initialize();
    
    return () => {
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, []);

  const branchFilteredCustomers = React.useMemo(() => {
    if (isLoading || !staffBranchName) {
      return [];
    }
    const staffBranch = allBranches.find(b => b.name === staffBranchName);
    if (!staffBranch) {
      return [];
    }
    const branchMetersForFiltering = getBulkMeters().filter(bm => bm.branchId === staffBranch.id);
    const branchMeterIds = branchMetersForFiltering.map(bm => bm.id);

    return allCustomers.filter(customer =>
      customer.branchId === staffBranch.id ||
      (customer.assignedBulkMeterId && branchMeterIds.includes(customer.assignedBulkMeterId))
    );
  }, [isLoading, staffBranchName, allBranches, allCustomers]);

  const branchBulkMetersList = React.useMemo(() => {
     if (!staffBranchName || allBranches.length === 0) {
      return [];
    }
    const staffBranch = allBranches.find(b => b.name === staffBranchName);
    if (!staffBranch) {
      return [];
    }
    return getBulkMeters()
      .filter(bm => bm.branchId === staffBranch.id)
      .map(bm => ({ id: bm.id, name: bm.name }));
  }, [staffBranchName, allBranches]);
  
  const searchedCustomers = React.useMemo(() => {
    if (!searchTerm) {
      return branchFilteredCustomers;
    }
    return branchFilteredCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.branchId && allBranches.find(b => b.id === customer.branchId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      customer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.assignedBulkMeterId && allBulkMeters.find(bm => bm.id === customer.assignedBulkMeterId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, branchFilteredCustomers, allBranches, allBulkMeters]);

  const paginatedCustomers = searchedCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
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
      const result = await deleteCustomerFromStore(customerToDelete.id);
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
    if (selectedCustomer) {
      const updatedCustomerData: Partial<Omit<IndividualCustomer, 'id'>> = {
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
      const result = await updateCustomerInStore(selectedCustomer.id, updatedCustomerData);
      if (result.success) {
        toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
      } else {
         toast({ variant: "destructive", title: "Update Failed", description: result.message || "Could not update customer."});
      }
    } else {
      const newCustomerData = {
        ...data,
        ordinal: Number(data.ordinal),
        meterSize: Number(data.meterSize),
        previousReading: Number(data.previousReading),
        currentReading: Number(data.currentReading),
        status: data.status as IndividualCustomerStatus || "Active",
        paymentStatus: data.paymentStatus as PaymentStatus || "Unpaid",
        customerType: data.customerType as CustomerType,
        sewerageConnection: data.sewerageConnection as SewerageConnection,
        assignedBulkMeterId: data.assignedBulkMeterId || undefined,
      } as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'calculatedBill'>;

      const result = await addCustomerToStore(newCustomerData);
      if (result.success && result.data) {
        toast({ title: "Customer Added", description: `${result.data.name} has been added.` });
      } else {
        toast({ variant: "destructive", title: "Add Failed", description: result.message || "Could not add customer."});
      }
    }
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
          Loading customers...
        </div>
      );
    }
    if (!staffBranchName) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-destructive/10 text-center text-destructive">
          Could not determine your branch. Please contact an administrator.
        </div>
      );
    }
    if (branchFilteredCustomers.length === 0 && !searchTerm) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
          No customers found for branch: {staffBranchName}. Click "Add New Customer" to get started. <User className="inline-block ml-2 h-5 w-5" />
        </div>
      );
    }
    return (
      <IndividualCustomerTable
        data={paginatedCustomers}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        bulkMetersList={allBulkMeters} 
        branches={allBranches}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Individual Customers {staffBranchName ? `(${staffBranchName})` : ''}</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleAddCustomer} disabled={isLoading || !staffBranchName}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer List for {staffBranchName || "Your Area"}</CardTitle>
          <CardDescription>View, edit, and manage individual customer information for your branch.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        {searchedCustomers.length > 0 && !isLoading && (
          <TablePagination
            count={searchedCustomers.length}
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

      <IndividualCustomerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitCustomer}
        defaultValues={selectedCustomer}
        bulkMeters={branchBulkMetersList} 
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
