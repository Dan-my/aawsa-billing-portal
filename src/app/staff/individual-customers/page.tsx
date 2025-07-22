

"use client";

import * as React from "react";
import { PlusCircle, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
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
import type { Branch } from "@/app/admin/branches/branch-types";
import { TablePagination } from "@/components/ui/table-pagination";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { StaffMember } from "@/app/admin/staff-management/staff-types";
import { usePermissions } from "@/hooks/use-permissions";

export default function StaffIndividualCustomersPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<StaffMember | null>(null);
  
  const [allCustomers, setAllCustomers] = React.useState<IndividualCustomer[]>([]);
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  
  React.useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }
  }, []);

  React.useEffect(() => {
    if (!currentUser?.branchId) {
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    setIsLoading(true);

    const initializeData = async () => {
      try {
        await Promise.all([initializeBranches(), initializeBulkMeters(), initializeCustomers()]);
        if (isMounted) {
          setAllBranches(getBranches());
          setAllBulkMeters(getBulkMeters());
          setAllCustomers(getCustomers());
        }
      } catch (err) {
        console.error("Failed to initialize data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    initializeData();
    
    const unSubBranches = subscribeToBranches((data) => isMounted && setAllBranches(data));
    const unSubBulkMeters = subscribeToBulkMeters((data) => isMounted && setAllBulkMeters(data));
    const unSubCustomers = subscribeToCustomers((data) => isMounted && setAllCustomers(data));

    return () => {
      isMounted = false;
      unSubBranches();
      unSubBulkMeters();
      unSubCustomers();
    };
  }, [currentUser]);

  // Declarative filtering with useMemo
  const branchFilteredData = React.useMemo(() => {
    if (!currentUser?.branchId) {
      return { customers: [], bulkMeters: [] };
    }
    
    const branchBMs = allBulkMeters.filter(bm => bm.branchId === currentUser?.branchId);
    const branchBMKeys = new Set(branchBMs.map(bm => bm.customerKeyNumber));
    
    const branchCustomers = allCustomers.filter(customer =>
      customer.branchId === currentUser?.branchId ||
      (customer.assignedBulkMeterId && branchBMKeys.has(customer.assignedBulkMeterId))
    );
    
    return { customers: branchCustomers, bulkMeters: branchBMs.map(bm => ({ customerKeyNumber: bm.customerKeyNumber, name: bm.name })) };
  }, [currentUser, allCustomers, allBulkMeters]);
  
  const searchedCustomers = React.useMemo(() => {
    if (!searchTerm) {
      return branchFilteredData.customers;
    }
    return branchFilteredData.customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.subCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.woreda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.assignedBulkMeterId && allBulkMeters.find(bm => bm.customerKeyNumber === customer.assignedBulkMeterId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, branchFilteredData.customers, allBulkMeters]);

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
      const result = await updateCustomerInStore(selectedCustomer.customerKeyNumber, data);
      if (result.success) {
        toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
      } else {
         toast({ variant: "destructive", title: "Update Failed", description: result.message || "Could not update customer."});
      }
    } else {
      const result = await addCustomerToStore(data, currentUser);
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
      return <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">Loading...</div>;
    }
    if (!currentUser?.branchId) {
      return <div className="mt-4 p-4 border rounded-md bg-destructive/10 text-center text-destructive">Your user profile is not configured for a staff role or branch.</div>;
    }
    if (branchFilteredData.customers.length === 0 && !searchTerm) {
      return <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">No customers found for your branch. Click "Add New Customer" to get started. <User className="inline-block ml-2 h-5 w-5" /></div>;
    }
    return (
      <IndividualCustomerTable
        data={paginatedCustomers}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        bulkMetersList={allBulkMeters.map(bm => ({ customerKeyNumber: bm.customerKeyNumber, name: bm.name }))}
        branches={allBranches}
        canEdit={hasPermission('customers_update')}
        canDelete={hasPermission('customers_delete')}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Individual Customers {currentUser?.branchName ? `(${currentUser.branchName})` : ''}</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!currentUser?.branchId}
            />
          </div>
          {hasPermission('customers_create') && (
            <Button onClick={handleAddCustomer} disabled={!currentUser?.branchId}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer List for {currentUser?.branchName || "Your Area"}</CardTitle>
          <CardDescription>View, edit, and manage individual customer information for your branch.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        {searchedCustomers.length > 0 && currentUser?.branchId && (
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

      {(hasPermission('customers_create') || hasPermission('customers_update')) && (
        <IndividualCustomerFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitCustomer}
          defaultValues={selectedCustomer}
          bulkMeters={branchFilteredData.bulkMeters}
          staffBranchName={currentUser?.branchName || undefined}
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
