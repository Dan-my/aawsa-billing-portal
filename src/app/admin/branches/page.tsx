
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
  initializeBranches // This will now fetch from Supabase if cache is empty
} from "@/lib/data-store";

// initialBranchesData is now effectively a fallback or example, Supabase is the source of truth.
export const initialBranchesData: Branch[] = [
  { id: "1", name: "Kality Branch", location: "Kality Sub-City, Woreda 05", contactPerson: "Abebe Kebede", contactPhone: "0911123456", status: "Active" },
  { id: "2", name: "Bole Branch", location: "Bole Sub-City, Near Airport", contactPerson: "Chaltu Lemma", contactPhone: "0912987654", status: "Active" },
  { id: "3", name: "Piassa Branch", location: "Arada Sub-City, Piassa", contactPerson: "Yosef Tadesse", contactPhone: "0913112233", status: "Inactive" },
  { id: "4", name: "Megenagna Branch", location: "Yeka Sub-City, Megenagna Area", contactPerson: "Sara Belay", status: "Active" },
];

export default function BranchesPage() {
  const { toast } = useToast();
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = React.useState<Branch | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    initializeBranches().then(() => {
      setBranches(getBranches());
      setIsLoading(false);
    });
    
    const unsubscribe = subscribeToBranches((updatedBranches) => {
      setBranches(updatedBranches);
      setIsLoading(false); // Also set loading to false on updates
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
      // Pass the ID and the form data as separate arguments as expected by the update function
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
          <Button onClick={handleAddBranch}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Branch
          </Button>
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
            />
          )}
        </CardContent>
      </Card>

      <BranchFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitBranch}
        defaultValues={selectedBranch}
      />

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
    </div>
  );
}
