
"use client";

import * as React from "react";
import { PlusCircle, UserCog, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "./staff-types";
import { StaffFormDialog, type StaffFormValues } from "./staff-form-dialog";
import { StaffTable } from "./staff-table";
import {
  getStaffMembers,
  addStaffMember as addStaffMemberToStore,
  updateStaffMember as updateStaffMemberInStore,
  deleteStaffMember as deleteStaffMemberFromStore,
  subscribeToStaffMembers,
  initializeStaffMembers,
  getBranches,
  initializeBranches,
  subscribeToBranches
} from "@/lib/data-store";
import type { Branch } from "../branches/branch-types";

export default function StaffManagementPage() {
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = React.useState<StaffMember | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    Promise.all([
      initializeStaffMembers(),
      initializeBranches()
    ]).then(() => {
      setStaffMembers(getStaffMembers());
      setBranches(getBranches());
      setIsLoading(false);
    });

    const unsubscribeStaff = subscribeToStaffMembers((updatedStaff) => {
      setStaffMembers(updatedStaff);
    });
    const unsubscribeBranches = subscribeToBranches((updatedBranches) => {
      setBranches(updatedBranches);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeBranches();
    };
  }, []);


  const handleAddStaff = () => {
    setSelectedStaff(null);
    setIsFormOpen(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsFormOpen(true);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setStaffToDelete(staff);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (staffToDelete) {
      const result = await deleteStaffMemberFromStore(staffToDelete.id);
      if (result.success) {
        toast({ title: "Staff Deleted", description: `${staffToDelete.name} has been removed.` });
      } else {
        toast({ variant: "destructive", title: "Deletion Failed", description: result.message });
      }
      setStaffToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitStaff = async (data: StaffFormValues) => {
    const staffDataPayload: Omit<StaffMember, 'id'> = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        branchId: data.branchId,
        status: data.status,
        phone: data.phone,
    };

    if (selectedStaff) {
      const result = await updateStaffMemberInStore(selectedStaff.id, staffDataPayload);
      if (result.success) {
        toast({ title: "Staff Updated", description: `${data.name} has been updated.` });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.message });
      }
    } else {
      const result = await addStaffMemberToStore(staffDataPayload);
      if (result.success) {
        toast({ title: "Staff Added", description: `${data.name} has been added.` });
      } else {
        toast({ variant: "destructive", title: "Add Failed", description: result.message });
      }
    }
    setIsFormOpen(false);
    setSelectedStaff(null);
  };
  
  const getBranchNameFromId = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || "";
  };

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBranchNameFromId(staff.branchId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search staff..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddStaff}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>Manage staff accounts and branch assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
              Loading staff members...
            </div>
          ) : staffMembers.length === 0 && !searchTerm ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No staff members found. Click "Add New Staff" to get started. <UserCog className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : (
            <StaffTable
              data={filteredStaff}
              branches={branches}
              onEdit={handleEditStaff}
              onDelete={handleDeleteStaff}
            />
          )}
        </CardContent>
      </Card>

      <StaffFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitStaff}
        defaultValues={selectedStaff}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff member {staffToDelete?.name}. This will also remove their login access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
