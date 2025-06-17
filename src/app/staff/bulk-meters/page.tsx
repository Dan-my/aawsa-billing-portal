
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
  initializeBulkMeters 
} from "@/lib/data-store";

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffBulkMetersPage() {
  const { toast } = useToast();
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [branchFilteredBulkMeters, setBranchFilteredBulkMeters] = React.useState<BulkMeter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBulkMeter, setSelectedBulkMeter] = React.useState<BulkMeter | null>(null);
  const [bulkMeterToDelete, setBulkMeterToDelete] = React.useState<BulkMeter | null>(null);
  const [staffBranchName, setStaffBranchName] = React.useState<string | undefined>(undefined);

  const filterBulkMetersByBranch = React.useCallback((meters: BulkMeter[], branchName?: string) => {
    if (!branchName) {
      return []; // Or meters if staff should see all on error/no branch
    }
    const simpleBranchName = branchName.replace(/ Branch$/i, "").toLowerCase().trim();
    return meters.filter(bm =>
      (bm.location?.toLowerCase() || "").includes(simpleBranchName) ||
      (bm.name?.toLowerCase() || "").includes(simpleBranchName) ||
      (bm.ward?.toLowerCase() || "").includes(simpleBranchName)
    );
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("user");
    let localBranchName: string | undefined;

    if (storedUser && isMounted) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
          localBranchName = parsedUser.branchName;
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }

    setIsLoading(true);
    initializeBulkMeters().then(() => {
      if (!isMounted) return;
      const currentMeters = getBulkMeters();
      setAllBulkMeters(currentMeters);
      setBranchFilteredBulkMeters(filterBulkMetersByBranch(currentMeters, localBranchName));
      setIsLoading(false);
    });
    
    const unsubscribe = subscribeToBulkMeters((updatedBulkMeters) => {
      if (!isMounted) return;
       setAllBulkMeters(updatedBulkMeters);
       setBranchFilteredBulkMeters(filterBulkMetersByBranch(updatedBulkMeters, localBranchName));
       // setIsLoading(false); // Re-consider if needed here or just initial load
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [filterBulkMetersByBranch]);

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
    // For staff, new bulk meters should ideally be associated with their branch.
    // This might involve pre-filling location/ward if possible, or validation.
    // For now, we'll rely on the form data.
    if (selectedBulkMeter) {
      const updatedBulkMeterData: BulkMeter = {
        id: selectedBulkMeter.id,
        ...data, 
      };
      await updateBulkMeterInStore(updatedBulkMeterData);
      toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    } else {
      // Ensure new bulk meters are associated with the staff's branch if possible.
      // This might require enhancing the form or how data is submitted.
      // Defaulting to Active and Unpaid as per admin data entry.
      const newBulkMeterData: Omit<BulkMeter, 'id'> = {
        ...data,
        status: data.status || "Active", 
        paymentStatus: data.paymentStatus || "Unpaid",
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
    bm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.ward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Bulk Meters ({staffBranchName || "All Branches"})</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bulk meters..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddBulkMeter}>
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
          {isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading bulk meters...
             </div>
          ) : branchFilteredBulkMeters.length === 0 && !searchTerm && staffBranchName ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No bulk meters found for branch: {staffBranchName}. Click "Add New Bulk Meter" to get started. <Gauge className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : branchFilteredBulkMeters.length === 0 && !staffBranchName ? (
            <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Could not determine your branch. Please contact an administrator.
            </div>
          ) : (
            <BulkMeterTable
              data={searchedBulkMeters}
              onEdit={handleEditBulkMeter}
              onDelete={handleDeleteBulkMeter}
            />
          )}
        </CardContent>
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
