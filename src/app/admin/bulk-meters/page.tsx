
"use client";

import * as React from "react";
import { PlusCircle, Gauge, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { BulkMeter, BulkMeterStatus } from "./bulk-meter-types";
import { BulkMeterFormDialog } from "./bulk-meter-form-dialog";
import { BulkMeterTable } from "./bulk-meter-table";

const initialBulkMeters: BulkMeter[] = [
  { id: "bm001", name: "Kality Industrial Meter", customerKeyNumber: "BMK001", contractNumber: "BMC001", meterSize: 3, meterNumber: "MTR-BM-001", previousReading: 10000, currentReading: 10500, month: "2023-11", specificArea: "Ind. Zone A", location: "Kality", ward: "Woreda 5", status: "Active" },
  { id: "bm002", name: "Bole Airport Feeder", customerKeyNumber: "BMB002", contractNumber: "BMC002", meterSize: 4, meterNumber: "MTR-BM-002", previousReading: 25000, currentReading: 26500, month: "2023-11", specificArea: "Airport Cargo", location: "Bole", ward: "Woreda 1", status: "Active" },
  { id: "bm003", name: "Megenagna Res. Supply", customerKeyNumber: "BMM003", contractNumber: "BMC003", meterSize: 2.5, meterNumber: "MTR-BM-003", previousReading: 5000, currentReading: 5200, month: "2023-11", specificArea: "Block 10", location: "Megenagna", ward: "Woreda 8", status: "Maintenance" },
];

type BulkMeterFormData = Omit<BulkMeter, 'id'> & { id?: string; status: BulkMeterStatus };


export default function BulkMetersPage() {
  const { toast } = useToast();
  const [bulkMeters, setBulkMeters] = React.useState<BulkMeter[]>(initialBulkMeters);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBulkMeter, setSelectedBulkMeter] = React.useState<BulkMeter | null>(null);
  const [bulkMeterToDelete, setBulkMeterToDelete] = React.useState<BulkMeter | null>(null);

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

  const confirmDelete = () => {
    if (bulkMeterToDelete) {
      setBulkMeters(bulkMeters.filter(bm => bm.id !== bulkMeterToDelete.id));
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeterToDelete.name} has been removed.` });
      setBulkMeterToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeter = (data: BulkMeterFormData) => {
    if (selectedBulkMeter) {
      // Edit existing bulk meter
      setBulkMeters(bulkMeters.map(bm => bm.id === selectedBulkMeter.id ? { ...selectedBulkMeter, ...data } : bm));
      toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    } else {
      // Add new bulk meter
      const newBulkMeter: BulkMeter = { ...data, id: Date.now().toString() }; // Ensure all fields from BulkMeter are present
      setBulkMeters([newBulkMeter, ...bulkMeters]);
      toast({ title: "Bulk Meter Added", description: `${newBulkMeter.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedBulkMeter(null);
  };

  const filteredBulkMeters = bulkMeters.filter(bm =>
    bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.ward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Bulk Meters Management</h1>
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
          <CardTitle>Bulk Meter List</CardTitle>
          <CardDescription>View, edit, and manage bulk meter information.</CardDescription>
        </CardHeader>
        <CardContent>
          {bulkMeters.length === 0 && !searchTerm ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                No bulk meters found. Click "Add New Bulk Meter" to get started. <Gauge className="inline-block ml-2 h-5 w-5" />
             </div>
          ) : (
            <BulkMeterTable
              data={filteredBulkMeters}
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
