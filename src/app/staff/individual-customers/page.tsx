

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
import type { BulkMeter as AdminBulkMeterType } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { Branch } from "@/app/admin/branches/branch-types";
import { TablePagination } from "@/components/ui/table-pagination";


interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffIndividualCustomersPage() {
  const { toast } = useToast();
  const [allCustomers, setAllCustomers] = React.useState<IndividualCustomer[]>([]);
  const [branchFilteredCustomers, setBranchFilteredCustomers] = React.useState<IndividualCustomer[]>([]);
  const [allBulkMeters, setAllBulkMeters] = React.useState<AdminBulkMeterType[]>([]);
  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  const [branchBulkMetersList, setBranchBulkMetersList] = React.useState<{id: string, name: string}[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  const [staffBranchName, setStaffBranchName] = React.useState<string | undefined>(undefined);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Effect to get user info from localStorage. Runs once.
  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const filterAndSetData = React.useCallback(() => {
    if (!staffBranchName) {
      setBranchFilteredCustomers([]);
      return;
    }

    const currentCustomers = getCustomers();
    const currentBulkMeters = getBulkMeters();
    const currentBranches = getBranches();

    const simpleBranchName = staffBranchName.replace(/ Branch$/i, "").toLowerCase().trim();
    const branch = currentBranches.find(b => b.name.toLowerCase().includes(simpleBranchName));

    const localBranchBulkMeters = currentBulkMeters.filter(bm => (branch && bm.branchId === branch.id) || (bm.location?.toLowerCase() || "").includes(simpleBranchName));
    const branchBulkMeterIds = localBranchBulkMeters.map(bm => bm.id);

    const localFilteredCustomers = currentCustomers.filter(customer => 
      (branch && customer.branchId && customer.branchId === branch.id) ||
      (customer.assignedBulkMeterId && branchBulkMeterIds.includes(customer.assignedBulkMeterId)) ||
      (customer.location?.toLowerCase() || "").includes(simpleBranchName)
    );
    
    setAllCustomers(currentCustomers);
    setAllBulkMeters(currentBulkMeters);
    setAllBranches(currentBranches);
    setBranchBulkMetersList(localBranchBulkMeters.map(bm => ({ id: bm.id, name: bm.name })));
    setBranchFilteredCustomers(localFilteredCustomers);
  }, [staffBranchName]);


  // Effect to fetch data and subscribe. Runs when staffBranchName is available.
  React.useEffect(() => {
    let isMounted = true;
    
    if (staffBranchName === undefined) {
      setIsLoading(true);
      return;
    }
    if (staffBranchName === null) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Promise.all([
      initializeBulkMeters(),
      initializeCustomers(),
      initializeBranches()
    ]).then(() => {
      if (isMounted) {
        filterAndSetData();
        setIsLoading(false);
      }
    });

    const unsubscribeCustomers = subscribeToCustomers(filterAndSetData);
    const unsubscribeBulkMeters = subscribeToBulkMeters(filterAndSetData);
    const unsubscribeBranches = subscribeToBranches(filterAndSetData);

    return () => {
      isMounted = false;
      unsubscribeCustomers();
      unsubscribeBulkMeters();
      unsubscribeBranches();
    };
  }, [staffBranchName, filterAndSetData]);


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

  const getBulkMeterNameFromAll = (id?: string) => { 
    if (!id) return "-";
    return allBulkMeters.find(bm => bm.id === id)?.name || "Unknown BM";
  };

  const searchedCustomers = branchFilteredCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.branchId && allBranches.find(b => b.id === customer.branchId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.assignedBulkMeterId && getBulkMeterNameFromAll(customer.assignedBulkMeterId).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedCustomers = searchedCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Individual Customers ({staffBranchName || "All Branches"})</h1>
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
          <CardTitle>Customer List for {staffBranchName || "Your Area"}</CardTitle>
          <CardDescription>View, edit, and manage individual customer information for your branch.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading customers...
             </div>
           ) : !staffBranchName && !isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Could not determine your branch. Please contact an administrator.
             </div>
           ) : branchFilteredCustomers.length === 0 && !searchTerm && staffBranchName ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No customers found for branch: {staffBranchName}. Click "Add New Customer" to get started. <User className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : (
            <IndividualCustomerTable
              data={paginatedCustomers}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              bulkMetersList={branchBulkMetersList} 
              branches={allBranches}
            />
          )}
        </CardContent>
        {searchedCustomers.length > 0 && (
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
