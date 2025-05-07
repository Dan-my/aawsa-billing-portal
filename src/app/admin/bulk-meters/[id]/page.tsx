"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Droplets, Edit, Trash2, MoreHorizontal, User, CheckCircle, XCircle, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  getBulkMeters,
  getCustomers,
  updateBulkMeter as updateBulkMeterInStore,
  deleteBulkMeter as deleteBulkMeterFromStore,
  updateCustomer as updateCustomerInStore,
  deleteCustomer as deleteCustomerFromStore,
  subscribeToBulkMeters,
  subscribeToCustomers,
  initializeBulkMeters, 
  initializeCustomers,  
} from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meter-types";
import type { IndividualCustomer } from "../../individual-customers/individual-customer-types";
import { TARIFF_RATE } from "../../individual-customers/individual-customer-types"; 
import { BulkMeterFormDialog, type BulkMeterFormValues } from "../bulk-meter-form-dialog"; // Import BulkMeterFormValues
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "../../individual-customers/individual-customer-form-dialog"; // Import IndividualCustomerFormValues
import { initialBulkMeters as defaultInitialBulkMeters } from "../page"; 
import { initialCustomers as defaultInitialCustomers } from "../../individual-customers/page"; 


export default function BulkMeterDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bulkMeterId = params.id as string;

  const [bulkMeter, setBulkMeter] = React.useState<BulkMeter | null>(null);
  const [associatedCustomers, setAssociatedCustomers] = React.useState<IndividualCustomer[]>([]);
  
  // Dialog states
  const [isBulkMeterFormOpen, setIsBulkMeterFormOpen] = React.useState(false);
  const [isBulkMeterDeleteDialogOpen, setIsBulkMeterDeleteDialogOpen] = React.useState(false);
  
  const [isCustomerFormOpen, setIsCustomerFormOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  const [isCustomerDeleteDialogOpen, setIsCustomerDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (getBulkMeters().length === 0) {
      initializeBulkMeters(defaultInitialBulkMeters);
    }
    if (getCustomers().length === 0) {
      initializeCustomers(defaultInitialCustomers);
    }
    
    let storesConsideredInitialized = getBulkMeters().length > 0 && getCustomers().length > 0;

    const updateLocalStateFromStores = () => {
      const currentGlobalMeters = getBulkMeters();
      const currentGlobalCustomers = getCustomers();

      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);
      
      if (foundBM) {
        setBulkMeter(foundBM);
        const associated = currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId);
        setAssociatedCustomers(associated);
      } else {
        if (storesConsideredInitialized) { 
          toast({ title: "Bulk Meter Not Found", description: "This bulk meter may not exist or has been deleted.", variant: "destructive" });
          router.push("/admin/bulk-meters");
        }
      }
    };

    updateLocalStateFromStores(); 

    const handleStoresUpdate = () => {
      storesConsideredInitialized = true; 
      updateLocalStateFromStores();
    };
    
    const unsubscribeBM = subscribeToBulkMeters(handleStoresUpdate);
    const unsubscribeCust = subscribeToCustomers(handleStoresUpdate);

    return () => {
      unsubscribeBM();
      unsubscribeCust();
    };
  }, [bulkMeterId, router, toast]);


  // Bulk Meter Actions
  const handleEditBulkMeter = () => setIsBulkMeterFormOpen(true);
  const handleDeleteBulkMeter = () => setIsBulkMeterDeleteDialogOpen(true);
  const confirmDeleteBulkMeter = () => {
    if (bulkMeter) {
      deleteBulkMeterFromStore(bulkMeter.id);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeter.name} has been removed.` });
      router.push("/admin/bulk-meters");
    }
    setIsBulkMeterDeleteDialogOpen(false);
  };
  const handleSubmitBulkMeterForm = (data: BulkMeterFormValues) => {
    if (bulkMeter) {
        const updatedBulkMeter: BulkMeter = { ...bulkMeter, ...data, id: bulkMeter.id };
        updateBulkMeterInStore(updatedBulkMeter);
        toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    }
    setIsBulkMeterFormOpen(false);
  };

  // Individual Customer Actions
  const handleEditCustomer = (customer: IndividualCustomer) => {
    setSelectedCustomer(customer);
    setIsCustomerFormOpen(true);
  };
  const handleDeleteCustomer = (customer: IndividualCustomer) => {
    setCustomerToDelete(customer);
    setIsCustomerDeleteDialogOpen(true);
  };
  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomerFromStore(customerToDelete.id);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
    }
    setCustomerToDelete(null);
    setIsCustomerDeleteDialogOpen(false);
  };
  const handleSubmitCustomerForm = (data: IndividualCustomerFormValues) => {
    if (selectedCustomer) {
      const usage = data.currentReading - data.previousReading;
      const calculatedBill = usage * TARIFF_RATE;
      const updatedCustomerData: IndividualCustomer = { 
          ...selectedCustomer, // Spread existing customer data first
          ...data, // Then spread form values which will overwrite relevant fields
          id: selectedCustomer.id, // Ensure ID is preserved
          calculatedBill 
      };
      
      updateCustomerInStore(updatedCustomerData);
      toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
    }
    
    setIsCustomerFormOpen(false);
    setSelectedCustomer(null);
  };


  if (!bulkMeter) {
    return <div className="p-4 text-center">Loading bulk meter details or not found...</div>;
  }

  const bulkUsage = bulkMeter.currentReading - bulkMeter.previousReading;
  const totalBulkBill = bulkUsage * TARIFF_RATE;
  
  const totalIndividualUsage = associatedCustomers.reduce((sum, cust) => sum + (cust.currentReading - cust.previousReading), 0);
  const totalIndividualBill = associatedCustomers.reduce((sum, cust) => sum + cust.calculatedBill, 0);

  const differenceUsage = bulkUsage - totalIndividualUsage;
  const differenceBill = totalBulkBill - totalIndividualBill;

  return (
    <div className="space-y-6 p-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Bulk Meter Details</CardTitle>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={handleEditBulkMeter} className="mr-2">
              <FileEdit className="mr-2 h-4 w-4" /> Edit Bulk Meter
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteBulkMeter}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Bulk Meter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p><strong className="font-semibold">Name:</strong> {bulkMeter.name}</p>
            <p><strong className="font-semibold">Location:</strong> {bulkMeter.location}, {bulkMeter.ward}</p>
            <p><strong className="font-semibold">Bulk Usage:</strong> {bulkUsage.toFixed(2)} m³</p>
            <p className={differenceBill < 0 ? "text-destructive" : "text-accent"}>
                <strong className="font-semibold">Difference Bill:</strong> ETB {differenceBill.toFixed(2)}
            </p>
          </div>
          <div>
            <p><strong className="font-semibold">Meter No:</strong> {bulkMeter.meterNumber}</p>
            <p><strong className="font-semibold">Month:</strong> {bulkMeter.month}</p>
             <p className="text-primary"><strong className="font-semibold">Total Bulk Bill:</strong> ETB {totalBulkBill.toFixed(2)}</p>
          </div>
          <div>
            <p><strong className="font-semibold">Customer Key:</strong> {bulkMeter.customerKeyNumber}</p>
            <p><strong className="font-semibold">Readings (Prev/Curr):</strong> {bulkMeter.previousReading.toFixed(2)} / {bulkMeter.currentReading.toFixed(2)}</p>
            <p className={differenceUsage < 0 ? "text-destructive" : "text-accent"}>
                <strong className="font-semibold">Difference Usage:</strong> {differenceUsage.toFixed(2)} m³
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Associated Individual Customers</CardTitle>
          <CardDescription>List of individual customers connected to this bulk meter.</CardDescription>
        </CardHeader>
        <CardContent>
          {associatedCustomers.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No individual customers are currently associated with this bulk meter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Meter No.</TableHead>
                  <TableHead>Prev. Read</TableHead>
                  <TableHead>Curr. Read</TableHead>
                  <TableHead>Usage (m³)</TableHead>
                  <TableHead>Calculated Bill (ETB)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associatedCustomers.map((customer) => {
                  const usage = customer.currentReading - customer.previousReading;
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.meterNumber}</TableCell>
                      <TableCell>{customer.previousReading.toFixed(2)}</TableCell>
                      <TableCell>{customer.currentReading.toFixed(2)}</TableCell>
                      <TableCell>{usage.toFixed(2)} m³</TableCell>
                      <TableCell className="text-accent">ETB {customer.calculatedBill.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={customer.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="whitespace-nowrap">
                          {customer.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : <XCircle className="mr-1 h-3.5 w-3.5"/>}
                          {customer.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteCustomer(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Meter Edit Dialog */}
      {bulkMeter && (
          <BulkMeterFormDialog
            open={isBulkMeterFormOpen}
            onOpenChange={setIsBulkMeterFormOpen}
            onSubmit={handleSubmitBulkMeterForm}
            defaultValues={bulkMeter}
          />
      )}
      <AlertDialog open={isBulkMeterDeleteDialogOpen} onOpenChange={setIsBulkMeterDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this bulk meter?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bulk meter: {bulkMeter?.name}. 
              Associated individual customers will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBulkMeter}>Delete Bulk Meter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Individual Customer Edit/Delete Dialogs */}
      {selectedCustomer && bulkMeter && ( 
          <IndividualCustomerFormDialog
            open={isCustomerFormOpen}
            onOpenChange={setIsCustomerFormOpen}
            onSubmit={handleSubmitCustomerForm}
            defaultValues={selectedCustomer}
            bulkMeters={[{id: bulkMeter.id, name: bulkMeter.name}]} 
          />
      )}
      <AlertDialog open={isCustomerDeleteDialogOpen} onOpenChange={setIsCustomerDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer: {customerToDelete?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCustomer}>Delete Customer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

