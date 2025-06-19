
"use client";

import * as React from "react";
import { PlusCircle, Ticket, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Voucher } from "./voucher-types";
import { VoucherFormDialog, type VoucherFormValues } from "./voucher-form-dialog"; 
import { VoucherTable } from "./voucher-table";
import { 
  getVouchers, 
  addVoucher as addVoucherToStore, 
  updateVoucher as updateVoucherInStore, 
  deleteVoucher as deleteVoucherFromStore,
  subscribeToVouchers,
  initializeVouchers 
} from "@/lib/data-store";
import { formatISO } from "date-fns";

export default function VoucherManagementPage() {
  const { toast } = useToast();
  const [vouchers, setVouchers] = React.useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedVoucher, setSelectedVoucher] = React.useState<Voucher | null>(null);
  const [voucherToDelete, setVoucherToDelete] = React.useState<Voucher | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    initializeVouchers().then(() => {
      setVouchers(getVouchers());
      setIsLoading(false);
    });
    
    const unsubscribe = subscribeToVouchers((updatedVouchers) => {
      setVouchers(updatedVouchers);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddVoucher = () => {
    setSelectedVoucher(null);
    setIsFormOpen(true);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsFormOpen(true);
  };

  const handleDeleteVoucher = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (voucherToDelete) {
      const result = await deleteVoucherFromStore(voucherToDelete.id);
       if (result.success) {
        toast({ title: "Voucher Deleted", description: `Voucher "${voucherToDelete.code}" has been removed.` });
      } else {
        toast({ variant: "destructive", title: "Delete Failed", description: result.message || "Could not delete voucher."});
      }
      setVoucherToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitVoucher = async (data: VoucherFormValues) => {
    const voucherDataForStore = {
      ...data,
      expiryDate: data.expiryDate ? formatISO(data.expiryDate) : null,
      maxUses: data.maxUses ?? null, // Ensure null if empty
      notes: data.notes || null,
    };

    if (selectedVoucher) {
      const result = await updateVoucherInStore(selectedVoucher.id, voucherDataForStore);
      if (result.success) {
        toast({ title: "Voucher Updated", description: `Voucher "${data.code}" has been updated.` });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.message || "Could not update voucher."});
      }
    } else {
      const result = await addVoucherToStore(voucherDataForStore as Omit<Voucher, 'id' | 'createdAt' | 'updatedAt'>);
      if (result.success && result.data) {
        toast({ title: "Voucher Added", description: `Voucher "${result.data.code}" has been added.` });
      } else {
        toast({ variant: "destructive", title: "Add Failed", description: result.message || "Could not add voucher."});
      }
    }
    setIsFormOpen(false);
    setSelectedVoucher(null);
  };

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (voucher.notes && voucher.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center">
          <Ticket className="mr-3 h-8 w-8 text-primary" /> Voucher Management
        </h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vouchers..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddVoucher}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Voucher
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Voucher List</CardTitle>
          <CardDescription>Manage discount vouchers and their details.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading vouchers...
             </div>
          ) : (
            <VoucherTable
              data={filteredVouchers}
              onEdit={handleEditVoucher}
              onDelete={handleDeleteVoucher}
            />
          )}
        </CardContent>
      </Card>

      <VoucherFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitVoucher}
        defaultValues={selectedVoucher}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the voucher "{voucherToDelete?.code}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVoucherToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
