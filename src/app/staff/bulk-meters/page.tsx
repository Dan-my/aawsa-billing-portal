

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
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffBulkMetersPage() {
  const { toast } = useToast();
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [branchFilteredBulkMeters, setBranchFilteredBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allBranches, setAllBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBulkMeter, setSelectedBulkMeter] = React.useState<BulkMeter | null>(null);
  const [bulkMeterToDelete, setBulkMeterToDelete] = React.useState<BulkMeter | null>(null);
  const [staffBranchName, setStaffBranchName] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // This single, comprehensive effect handles fetching user info, loading data,
  // filtering data, and setting up subscriptions. It runs only once on mount.
  React.useEffect(() => {
    let isMounted = true;

    const initializeAndFilterData = async () => {
        // 1. Determine User's Branch
        const storedUser = localStorage.getItem("user");
        let localBranchName: string | undefined;
        if (storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                if (parsedUser.role === "staff" && parsedUser.branchName) {
                    localBranchName = parsedUser.branchName;
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
        
        if (isMounted) {
          setStaffBranchName(localBranchName || null);
        }

        // 2. If no branch, stop loading and do nothing else.
        if (!localBranchName) {
            if (isMounted) setIsLoading(false);
            return;
        }
        
        // 3. Load all necessary data from the store
        await Promise.all([initializeBranches(), initializeBulkMeters()]);
        if (!isMounted) return;

        // 4. Filter data based on the determined branch
        const currentBranches = getBranches();
        const currentMeters = getBulkMeters();
        const staffBranchObject = currentBranches.find(b => b.name === localBranchName);

        if (staffBranchObject) {
            const staffBranchId = staffBranchObject.id;
            const filteredMeters = currentMeters.filter(bm => bm.branchId === staffBranchId);
            setBranchFilteredBulkMeters(filteredMeters);
        } else {
            setBranchFilteredBulkMeters([]); // Branch name from login doesn't match any in DB
        }
        
        setAllBranches(currentBranches);
        setAllBulkMeters(currentMeters);
        setIsLoading(false); // Done loading

        // 5. Set up subscriptions to keep data fresh
        const handleDataUpdate = () => {
            if (!isMounted || !localBranchName) return;
            const updatedBranches = getBranches();
            const updatedMeters = getBulkMeters();
            const updatedStaffBranch = updatedBranches.find(b => b.name === localBranchName);
            if (updatedStaffBranch) {
                const filtered = updatedMeters.filter(bm => bm.branchId === updatedStaffBranch.id);
                setBranchFilteredBulkMeters(filtered);
            } else {
                setBranchFilteredBulkMeters([]);
            }
            setAllBranches(updatedBranches);
            setAllBulkMeters(updatedMeters);
        };

        const unsubBranches = subscribeToBranches(handleDataUpdate);
        const unsubBM = subscribeToBulkMeters(handleDataUpdate);
        
        return () => {
          unsubBranches();
          unsubBM();
        };
    };

    const cleanupPromise = initializeAndFilterData();

    return () => {
      isMounted = false;
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []); // Empty dependency array ensures this runs only once.


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
    if (selectedBulkMeter) {
      await updateBulkMeterInStore(selectedBulkMeter.id, data);
      toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    } else {
      const newBulkMeterData: Omit<BulkMeter, 'id'> = {
        ...data,
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

  const searchedBulkMeters = branchFilteredBulkMeters.filter(bm =>
    bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bm.branchId && allBranches.find(b => b.id === bm.branchId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    bm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.ward.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paginatedBulkMeters = searchedBulkMeters.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
          Loading bulk meters...
        </div>
      );
    }
    if (!staffBranchName) {
      return (
        <div className="mt-4 p-4 border rounded-md bg-destructive/10 text-center text-destructive-foreground">
          Could not determine your branch. Please contact an administrator.
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
              disabled={!staffBranchName}
            />
          </div>
          <Button onClick={handleAddBulkMeter} disabled={!staffBranchName}>
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
         {searchedBulkMeters.length > 0 && (
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
