
"use client";

import * as React from "react";
import { PlusCircle, Building, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Branch } from "./branch-types";
import { BranchFormDialog, type BranchFormValues } from "./branch-form-dialog"; 
import { BranchTable } from "./branch-table";
import { 
  getBranches, 
  addBranch as addBranchToStore, 
  updateBranch as updateBranchInStore, 
  deleteBranch as deleteBranchFromStore,
  subscribeToBranches,
  initializeBranches
} from "@/lib/data-store";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function BranchesPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = React.useState<Branch | null>(null);
  
  const canCreate = hasPermission('branches_create');
  const canUpdate = hasPermission('branches_update');
  const canDelete = hasPermission('branches_delete');
  const canView = hasPermission('branches_view');

  React.useEffect(() => {
    setIsLoading(true);
    initializeBranches().then(() => {
      setBranches(getBranches());
      setIsLoading(false);
    });
    
    const unsubscribe = subscribeToBranches((updatedBranches) => {
      setBranches(updatedBranches);
      setIsLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsFormOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsFormOpen(true);
  };

  const handleDeleteBranch = (branch: Branch) => {
    setBranchToDelete(branch);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (branchToDelete) {
      await deleteBranchFromStore(branchToDelete.id);
      toast({ title: "Branch Deleted", description: `${branchToDelete.name} has been removed.` });
      setBranchToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitBranch = async (data: BranchFormValues) => {
    if (selectedBranch) {
      await updateBranchInStore(selectedBranch.id, data);
      toast({ title: "Branch Updated", description: `${data.name} has been updated.` });
    } else {
      await addBranchToStore(data); 
      toast({ title: "Branch Added", description: `${data.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedBranch(null);
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (branch.contactPerson && branch.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (!canView) {
      return (
          <div className="space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold">Branch Management</h1>
              <Alert variant="destructive">
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Access Denied</AlertTitle>
                  <CardDescription>You do not have permission to view this page.</CardDescription>
              </Alert>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Branch Management</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search branches..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button onClick={handleAddBranch}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Branch
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Branch List</CardTitle>
          <CardDescription>Manage AAWSA branches and their details.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
              Loading branches...
            </div>
          ) : branches.length === 0 && !searchTerm ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No branches found. Click "Add New Branch" to get started. <Building className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : (
            <BranchTable
              data={filteredBranches}
              onEdit={handleEditBranch}
              onDelete={handleDeleteBranch}
              canEdit={canUpdate}
              canDelete={canDelete}
            />
          )}
        </CardContent>
      </Card>

      {(canCreate || canUpdate) && (
        <BranchFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitBranch}
          defaultValues={selectedBranch}
        />
      )}

      {canDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the branch {branchToDelete?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBranchToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
