
"use client";

import * as React from "react";
import { PlusCircle, Gauge, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { BulkMeterFormDialog, type BulkMeterFormValues } from "@/app/admin/bulk-meters/bulk-meter-form-dialog"; 
import { BulkMeterTable } from "./bulk-meter-table"; 
import { 
  getBulkMeters, 
  addBulkMeter as addBulkMeterToStore, 
  updateBulkMeter as updateBulkMeterInStore, 
  deleteBulkMeter as deleteBulkMeterFromStore,
  subscribeToBulkMeters,
  initializeBulkMeters,
  getBranches,
  initializeBranches,
  subscribeToBranches
} from "@/lib/data-store";
import type { Branch } from "@/app/admin/branches/branch-types";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePermissions } from "@/hooks/use-permissions";

interface User {
  email: string;
  role: "admin" | "staff" | "Admin" | "Staff";
  branchName?: string;
  branchId?: string;
}

export default function StaffBulkMetersPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = React.useState<'loading' | 'unauthorized' | 'authorized'>('loading');
  const [staffBranchName, setStaffBranchName] = React.useState<string | null>(null);
  const [staffBranchId, setStaffBranchId] = React.useState<string | null>(null);
  
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBulkMeter, setSelectedBulkMeter] = React.useState<BulkMeter | null>(null);
  const [bulkMeterToDelete, setBulkMeterToDelete] = React.useState<BulkMeter | null>(null);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // First useEffect for authentication check
  React.useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const parsedUser: User = JSON.parse(userString);
        if (parsedUser.role.toLowerCase() === 'staff' && parsedUser.branchId && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
          setStaffBranchId(parsedUser.branchId);
          setAuthStatus('authorized');
        } else {
          setAuthStatus('unauthorized');
        }
      } catch {
        setAuthStatus('unauthorized');
      }
    } else {
      setAuthStatus('unauthorized');
    }
  }, []);

  // Second useEffect for data loading, dependent on auth status
  React.useEffect(() => {
    if (authStatus !== 'authorized') {
      if (authStatus !== 'loading') setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const initializeAndSubscribe = async () => {
        try {
          await Promise.all([initializeBranches(), initializeBulkMeters()]);
          if (isMounted) {
            setAllBranches(getBranches());
            setAllBulkMeters(getBulkMeters());
          }
        } catch (err) {
            console.error("Failed to initialize data:", err);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };
    
    initializeAndSubscribe();
    
    const unSubBranches = subscribeToBranches((data) => isMounted && setAllBranches(data));
    const unSubBulkMeters = subscribeToBulkMeters((data) => isMounted && setAllBulkMeters(data));

    return () => {
      isMounted = false;
      unSubBranches();
      unSubBulkMeters();
    };
  }, [authStatus]);


  // Declarative filtering with useMemo
  const branchFilteredBulkMeters = React.useMemo(() => {
    if (authStatus !== 'authorized' || !staffBranchId) {
      return [];
    }
    return allBulkMeters.filter(bm => bm.branchId === staffBranchId);
  }, [authStatus, staffBranchId, allBulkMeters]);


  const searchedBulkMeters = React.useMemo(() => {
     if (!searchTerm) {
      return branchFilteredBulkMeters;
    }
    return branchFilteredBulkMeters.filter(bm =>
      bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bm.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bm.subCity && bm.subCity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bm.woreda && bm.woreda.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, branchFilteredBulkMeters]);
  
  const paginatedBulkMeters = searchedBulkMeters.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleAddBulkMeter = () => {
    setSelectedBulkMeter(null);
    setIsFormOpen(true);
  };

  const handleEditBulkMeter = (bulkMeter: BulkMeter) => {
    setSelectedBulkMeter(bulkMeter);
    setIsFormOpen(true);
  };

  const handleDeleteBulkMeter = (bulkMeter: BulkMeter) => {
    setBulkMeterToDelete(bulkMeter);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (bulkMeterToDelete) {
      await deleteBulkMeterFromStore(bulkMeterToDelete.customerKeyNumber);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeterToDelete.name} has been removed.` });
      setBulkMeterToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeter = async (data: BulkMeterFormValues) => {
    // Automatically associate with staff's branch ID
    const dataWithBranchId = { ...data, branchId: staffBranchId, subCity: staffBranchName || data.subCity };
    
    if (selectedBulkMeter) {
      await updateBulkMeterInStore(selectedBulkMeter.customerKeyNumber, dataWithBranchId);
      toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    } else {
      const newBulkMeterData: Omit<BulkMeter, 'customerKeyNumber'> & {customerKeyNumber: string} = {
        ...dataWithBranchId,
        status: "Active", 
        paymentStatus: "Unpaid",
        outStandingbill: 0,
      };
      await addBulkMeterToStore(newBulkMeterData); 
      toast({ title: "Bulk Meter Added", description: `${data.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedBulkMeter(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
          Loading...
        </div>
      );
    }
    if (authStatus === 'unauthorized') {
      return (
        <div className="mt-4 p-4 border rounded-md bg-destructive/10 text-center text-destructive">
          Your user profile is not configured for a staff role or branch.
        </div>
      );
    }
    if (branchFilteredBulkMeters.length === 0 && !searchTerm) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
          No bulk meters found for branch: {staffBranchName}. Click "Add New Bulk Meter" to get started. <Gauge className="inline-block ml-2 h-5 w-5" />
        </div>
      );
    }
    return (
      <BulkMeterTable
        data={paginatedBulkMeters}
        onEdit={handleEditBulkMeter}
        onDelete={handleDeleteBulkMeter}
        branches={allBranches}
        canEdit={hasPermission('bulk_meters_update')}
        canDelete={hasPermission('bulk_meters_delete')}
      />
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Bulk Meters {staffBranchName ? `(${staffBranchName})` : ''}</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bulk meters..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={authStatus !== 'authorized'}
            />
          </div>
          {hasPermission('bulk_meters_create') && (
            <Button onClick={handleAddBulkMeter} disabled={authStatus !== 'authorized'}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Bulk Meter
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bulk Meter List for {staffBranchName || "Your Area"}</CardTitle>
          <CardDescription>View, edit, and manage bulk meter information for your branch.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
         {searchedBulkMeters.length > 0 && authStatus === 'authorized' && (
          <TablePagination
            count={searchedBulkMeters.length}
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

      {(hasPermission('bulk_meters_create') || hasPermission('bulk_meters_update')) && (
        <BulkMeterFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitBulkMeter}
          defaultValues={selectedBulkMeter}
          staffBranchName={staffBranchName || undefined}
        />
      )}

      {hasPermission('bulk_meters_delete') && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the bulk meter {bulkMeterToDelete?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBulkMeterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
