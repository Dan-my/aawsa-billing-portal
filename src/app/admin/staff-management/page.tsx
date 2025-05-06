
"use client";

import * as React from "react";
import { PlusCircle, UserCog, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "./staff-types";
import { StaffFormDialog } from "./staff-form-dialog";
import { StaffTable } from "./staff-table";

const initialStaffMembers: StaffMember[] = [
  { id: "1", name: "Alice Wonderland", email: "alice@example.com", role: "Manager", branch: "Kality Branch", status: "Active" },
  { id: "2", name: "Bob The Builder", email: "bob@example.com", role: "Technician", branch: "Central Branch", status: "Active" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", role: "Cashier", branch: "Kality Branch", status: "Inactive" },
  { id: "4", name: "Diana Prince", email: "diana@example.com", role: "Support", branch: "North Branch", status: "Active" },
];

export default function StaffManagementPage() {
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>(initialStaffMembers);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = React.useState<StaffMember | null>(null);

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

  const confirmDelete = () => {
    if (staffToDelete) {
      setStaffMembers(staffMembers.filter(s => s.id !== staffToDelete.id));
      toast({ title: "Staff Deleted", description: `${staffToDelete.name} has been removed.` });
      setStaffToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitStaff = (data: Omit<StaffMember, 'id'> & { id?: string }) => {
    if (selectedStaff) {
      // Edit existing staff
      setStaffMembers(staffMembers.map(s => s.id === selectedStaff.id ? { ...s, ...data, id: selectedStaff.id } : s));
      toast({ title: "Staff Updated", description: `${data.name} has been updated.` });
    } else {
      // Add new staff
      const newStaff: StaffMember = { ...data, id: Date.now().toString() };
      setStaffMembers([newStaff, ...staffMembers]);
      toast({ title: "Staff Added", description: `${newStaff.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedStaff(null);
  };

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.branch.toLowerCase().includes(searchTerm.toLowerCase())
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
          <CardDescription>Manage staff accounts, roles, and branch assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {staffMembers.length === 0 && !searchTerm ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No staff members found. Click "Add New Staff" to get started. <UserCog className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : (
            <StaffTable
              data={filteredStaff}
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
              This action cannot be undone. This will permanently delete the staff member {staffToDelete?.name}.
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
