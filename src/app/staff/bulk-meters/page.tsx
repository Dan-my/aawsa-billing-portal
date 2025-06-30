
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
import { BulkMeterTable } from "@/app/admin/bulk-meters/bulk-meter-table";
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

interface User {
  email: string;
  role: "admin" | "staff" | "Admin" | "Staff";
  branchName?: string;
}

export default function StaffBulkMetersPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [authStatus, setAuthStatus] = React.useState<'loading' | 'unauthorized' | 'authorized'>('loading');
  const [staffBranchName, setStaffBranchName] = React.useState<string | null>(null);
  
  const [branchFilteredBulkMeters, setBranchFilteredBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allBranchesForTable, setAllBranchesForTable] = React.useState<Branch[]>([]);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBulkMeter, setSelectedBulkMeter] = React.useState<BulkMeter | null>(null);
  const [bulkMeterToDelete, setBulkMeterToDelete] = React.useState<BulkMeter | null>(null);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  React.useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const parsedUser: User = JSON.parse(userString);
        if (parsedUser.role.toLowerCase() === 'staff' && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
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

  const filterAndSetData = React.useCallback(() => {
    if (!staffBranchName) {
      setBranchFilteredBulkMeters([]);
      setAllBranchesForTable(getBranches());
      return;
    }
    
    const branches = getBranches();
    const bulkMeters = getBulkMeters();
    setAllBranchesForTable(branches);

    const staffBranch = branches.find(b => b.name.trim().toLowerCase() === staffBranchName.trim().toLowerCase());
    
    if (staffBranch) {
      const filtered = bulkMeters.filter(bm => bm.branchId === staffBranch.id);
      setBranchFilteredBulkMeters(filtered);
    } else {
      setBranchFilteredBulkMeters([]);
    }
    setIsLoading(false);
  }, [staffBranchName]);


  React.useEffect(() => {
    if (authStatus !== 'authorized') {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const initializeAndFilter = async () => {
        try {
          await Promise.all([
            initializeBranches(),
            initializeBulkMeters(),
          ]);
        } catch (err) {
            console.error("Failed to initialize data:", err);
        } finally {
            if (isMounted) {
              filterAndSetData();
            }
        }
    };
    
    initializeAndFilter();
    
    const unSubBranches = subscribeToBranches(filterAndSetData);
    const unSubBulkMeters = subscribeToBulkMeters(filterAndSetData);

    return () => {
      isMounted = false;
      unSubBranches();
      unSubBulkMeters();
    };
  }, [authStatus, filterAndSetData]);


  const searchedBulkMeters = React.useMemo(() => {
     if (!searchTerm) {
      return branchFilteredBulkMeters;
    }
    return branchFilteredBulkMeters.filter(bm =>
      bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bm.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bm.location && bm.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bm.ward && bm.ward.toLowerCase().includes(searchTerm.toLowerCase()))
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
      await deleteBulkMeterFromStore(bulkMeterToDelete.id);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeterToDelete.name} has been removed.` });
      setBulkMeterToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeter = async (data: BulkMeterFormValues) => {
    const staffBranch = getBranches().find(b => b.name.trim().toLowerCase() === staffBranchName?.trim().toLowerCase());
    const dataWithBranchId = { ...data, branchId: staffBranch?.id || data.branchId };
    
    if (selectedBulkMeter) {
      await updateBulkMeterInStore(selectedBulkMeter.id, dataWithBranchId);
      toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    } else {
      const newBulkMeterData: Omit<BulkMeter, 'id'> = {
        ...dataWithBranchId,
        status: data.status || "Active", 
        paymentStatus: data.paymentStatus || "Unpaid",
        outStandingbill: 0,
      };
      await addBulkMeterToStore(newBulkMeterData); 
      toast({ title: "Bulk Meter Added", description: `${data.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedBulkMeter(null);
  };
  
  const renderContent = () => {
    if (isLoading || authStatus === 'loading') {
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
        branches={allBranchesForTable}
      />
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Bulk Meters {staffBranchName ? `(${staffBranchName})` : ''}</h1>
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
          <Button onClick={handleAddBulkMeter} disabled={authStatus !== 'authorized'}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Bulk Meter
          </Button>
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

      <BulkMeterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitBulkMeter}
        defaultValues={selectedBulkMeter}
      />

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
    </div>
  );
}
