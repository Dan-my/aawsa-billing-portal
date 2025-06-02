
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Droplets, Edit, Trash2, MoreHorizontal, User, CheckCircle, XCircle, FileEdit, RefreshCcw } from "lucide-react";
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
import type { IndividualCustomer, PaymentStatus, CustomerType, SewerageConnection } from "../../individual-customers/individual-customer-types";
import { calculateBill } from "../../individual-customers/individual-customer-types";
import { BulkMeterFormDialog, type BulkMeterFormValues } from "../bulk-meter-form-dialog";
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "../../individual-customers/individual-customer-form-dialog";

export default function BulkMeterDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bulkMeterId = params.id as string;

  const [bulkMeter, setBulkMeter] = useState<BulkMeter | null>(null);
  const [associatedCustomers, setAssociatedCustomers] = useState<IndividualCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isBulkMeterFormOpen, setIsBulkMeterFormOpen] = React.useState(false);
  const [isBulkMeterDeleteDialogOpen, setIsBulkMeterDeleteDialogOpen] = React.useState(false);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  const [isCustomerDeleteDialogOpen, setIsCustomerDeleteDialogOpen] = React.useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!bulkMeterId) {
      setIsLoading(false);
      setBulkMeter(null);
      toast({ title: "Invalid Bulk Meter ID", description: "The ID for the bulk meter is missing in the URL.", variant: "destructive" });
      router.push("/admin/bulk-meters");
      return;
    }

    setIsLoading(true);

    Promise.all([
      initializeBulkMeters(),
      initializeCustomers()
    ]).then(() => {
      if (!isMounted) return;

      const currentGlobalMeters = getBulkMeters();
      const currentGlobalCustomers = getCustomers();
      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);

      if (foundBM) {
        setBulkMeter(foundBM);
        const associated = currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId);
        setAssociatedCustomers(associated);
      } else {
        setBulkMeter(null);
        toast({ title: "Bulk Meter Not Found", description: "This bulk meter may not exist or has been deleted.", variant: "destructive" });
      }
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing data for bulk meter details page:", error);
      toast({ title: "Error Loading Data", description: "Could not load necessary data. Please try again.", variant: "destructive" });
      setBulkMeter(null);
      setIsLoading(false);
    });

    const handleStoresUpdate = () => {
      if (!isMounted) return;
      const currentGlobalMeters = getBulkMeters();
      const currentGlobalCustomers = getCustomers();
      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);

      if (foundBM) {
        setBulkMeter(foundBM);
        const associated = currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId);
        setAssociatedCustomers(associated);
      } else if (bulkMeter) { // Check if bulkMeter was previously set
         toast({ title: "Bulk Meter Update", description: "The bulk meter being viewed may have been deleted or is no longer accessible.", variant: "destructive" });
         setBulkMeter(null); // Clear if no longer found
      }
    };

    const unsubscribeBM = subscribeToBulkMeters(handleStoresUpdate);
    const unsubscribeCust = subscribeToCustomers(handleStoresUpdate);

    return () => {
      isMounted = false;
      unsubscribeBM();
      unsubscribeCust();
    };
  }, [bulkMeterId, router, toast]); // Removed bulkMeter from dependencies


  const handleEditBulkMeter = () => setIsBulkMeterFormOpen(true);
  const handleDeleteBulkMeter = () => setIsBulkMeterDeleteDialogOpen(true);
  const confirmDeleteBulkMeter = async () => {
    if (bulkMeter) {
      await deleteBulkMeterFromStore(bulkMeter.id);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeter.name} has been removed.` });
      router.push("/admin/bulk-meters");
    }
    setIsBulkMeterDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeterForm = async (data: BulkMeterFormValues) => {
    if (bulkMeter) {
        // data comes from BulkMeterFormDialog and is already validated by Zod.
        // Its numeric fields (meterSize, previousReading, currentReading) are numbers.
        const updatedBulkMeterData: BulkMeter = {
          id: bulkMeter.id, // Keep the original ID
          ...data, // Spread validated form data (name, readings, status, paymentStatus, etc.)
        };
        await updateBulkMeterInStore(updatedBulkMeterData);
        toast({ title: "Bulk Meter Updated", description: `${updatedBulkMeterData.name} has been updated.` });
    }
    setIsBulkMeterFormOpen(false);
  };

  const handleToggleBulkMeterPaymentStatus = async () => {
    if (bulkMeter) {
      const newStatus: PaymentStatus = bulkMeter.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
      const updatedBulkMeterData: BulkMeter = {
        ...bulkMeter,
        paymentStatus: newStatus,
        // Ensure numeric fields are numbers, defaulting to 0 if undefined/null from state
        meterSize: Number(bulkMeter.meterSize ?? 0),
        previousReading: Number(bulkMeter.previousReading ?? 0),
        currentReading: Number(bulkMeter.currentReading ?? 0),
      };
      await updateBulkMeterInStore(updatedBulkMeterData);
      toast({ title: "Payment Status Updated", description: `${updatedBulkMeterData.name} payment status set to ${newStatus}.` });
    }
  };

  const handleEditCustomer = (customer: IndividualCustomer) => {
    setSelectedCustomer(customer);
    setIsCustomerFormOpen(true);
  };
  const handleDeleteCustomer = (customer: IndividualCustomer) => {
    setCustomerToDelete(customer);
    setIsCustomerDeleteDialogOpen(true);
  };
  const confirmDeleteCustomer = async () => {
    if (customerToDelete) {
      await deleteCustomerFromStore(customerToDelete.id);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
    }
    setCustomerToDelete(null);
    setIsCustomerDeleteDialogOpen(false);
  };
  const handleSubmitCustomerForm = async (data: IndividualCustomerFormValues) => {
    if (selectedCustomer) {
      const usage = (Number(data.currentReading) ?? 0) - (Number(data.previousReading) ?? 0);
      const calculatedBill = calculateBill(usage, data.customerType as CustomerType, data.sewerageConnection as SewerageConnection);
      const updatedCustomerData: IndividualCustomer = {
          ...selectedCustomer,
          ...data,
          id: selectedCustomer.id,
          calculatedBill,
          // Ensure numeric fields from form data are numbers, defaulting to existing or 0
          meterSize: Number(data.meterSize ?? selectedCustomer.meterSize ?? 0),
          previousReading: Number(data.previousReading ?? selectedCustomer.previousReading ?? 0),
          currentReading: Number(data.currentReading ?? selectedCustomer.currentReading ?? 0),
          ordinal: Number(data.ordinal ?? selectedCustomer.ordinal ?? 0),
      };

      await updateCustomerInStore(updatedCustomerData);
      toast({ title: "Customer Updated", description: `${updatedCustomerData.name} has been updated.` });
    }

    setIsCustomerFormOpen(false);
    setSelectedCustomer(null);
  };

  const handleToggleCustomerPaymentStatus = async (customerId: string) => {
    const customer = associatedCustomers.find(c => c.id === customerId);
    if (customer) {
      const newStatus: PaymentStatus = customer.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
      const updatedCustomerData: IndividualCustomer = {
        ...customer,
        paymentStatus: newStatus,
        // Defensive coercion
        meterSize: Number(customer.meterSize ?? 0),
        previousReading: Number(customer.previousReading ?? 0),
        currentReading: Number(customer.currentReading ?? 0),
        ordinal: Number(customer.ordinal ?? 0),
        calculatedBill: Number(customer.calculatedBill ?? 0),
      };
      await updateCustomerInStore(updatedCustomerData);
      toast({ title: "Payment Status Updated", description: `${updatedCustomerData.name}'s payment status set to ${newStatus}.` });
    }
  };


  if (isLoading) {
    return <div className="p-4 text-center">Loading bulk meter details...</div>;
  }
  if (!bulkMeter && !isLoading) {
     return <div className="p-4 text-center">Bulk meter not found or an error occurred.</div>;
  }
  // Add a null check for bulkMeter before accessing its properties
  if (!bulkMeter) {
    return <div className="p-4 text-center">Bulk meter data is unavailable.</div>;
  }


  const bmPreviousReading = bulkMeter.previousReading ?? 0;
  const bmCurrentReading = bulkMeter.currentReading ?? 0;
  const bulkUsage = bmCurrentReading - bmPreviousReading;

  let effectiveBulkMeterCustomerType: CustomerType = "Non-domestic";
  let effectiveBulkMeterSewerageConnection: SewerageConnection = "No";

  if (associatedCustomers.length > 0) {
    const hasNonDomesticCustomer = associatedCustomers.some(c => c.customerType === "Non-domestic");
    if (!hasNonDomesticCustomer) {
      effectiveBulkMeterCustomerType = "Domestic";
      effectiveBulkMeterSewerageConnection = "No";
    }
  }
  const totalBulkBill = calculateBill(bulkUsage, effectiveBulkMeterCustomerType, effectiveBulkMeterSewerageConnection);

  const totalIndividualUsage = associatedCustomers.reduce((sum, cust) => {
    const custPrevReading = cust.previousReading ?? 0;
    const custCurrReading = cust.currentReading ?? 0;
    return sum + (custCurrReading - custPrevReading);
  }, 0);
  const totalIndividualBill = associatedCustomers.reduce((sum, cust) => sum + (cust.calculatedBill ?? 0), 0);

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
            <p><strong className="font-semibold">Location:</strong> {bulkMeter.location ?? 'N/A'}, {bulkMeter.ward ?? 'N/A'}</p>
            <p><strong className="font-semibold">Bulk Usage:</strong> {bulkUsage.toFixed(2)} m³</p>
          </div>
          <div>
            <p><strong className="font-semibold">Meter No:</strong> {bulkMeter.meterNumber ?? 'N/A'}</p>
            <p><strong className="font-semibold">Month:</strong> {bulkMeter.month ?? 'N/A'}</p>
             <p className="text-primary"><strong className="font-semibold">Total Bulk Bill (Tariff: {effectiveBulkMeterCustomerType}):</strong> ETB {totalBulkBill.toFixed(2)}</p>
          </div>
          <div>
            <p><strong className="font-semibold">Customer Key:</strong> {bulkMeter.customerKeyNumber ?? 'N/A'}</p>
            <p><strong className="font-semibold">Readings (Prev/Curr):</strong> {(bmPreviousReading).toFixed(2)} / {(bmCurrentReading).toFixed(2)}</p>
            <p className={differenceUsage < 0 ? "text-destructive" : "text-accent"}>
                <strong className="font-semibold">Difference Usage:</strong> {differenceUsage.toFixed(2)} m³
            </p>
          </div>
          <div>
            <p className={differenceBill < 0 ? "text-destructive" : "text-accent"}>
              <strong className="font-semibold">Difference Bill (vs Sum of Indiv.):</strong> ETB {differenceBill.toFixed(2)}
            </p>
          </div>
           <div className="flex items-center gap-2">
             <strong className="font-semibold">Payment Status:</strong>
             <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleBulkMeterPaymentStatus}
                className="p-0 h-auto group"
                aria-label={`Toggle payment status for ${bulkMeter.name}`}
              >
                <Badge variant={bulkMeter.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="cursor-pointer hover:opacity-80">
                  {bulkMeter.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : <XCircle className="mr-1 h-3.5 w-3.5"/>}
                  {bulkMeter.paymentStatus}
                  <RefreshCcw className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              </Button>
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
                  <TableHead>Usage (m³)</TableHead>
                  <TableHead>Calculated Bill (ETB)</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associatedCustomers.map((customer) => {
                  const custPrevReading = customer.previousReading ?? 0;
                  const custCurrReading = customer.currentReading ?? 0;
                  const usage = custCurrReading - custPrevReading;
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.meterNumber}</TableCell>
                      <TableCell>{usage.toFixed(2)}</TableCell>
                      <TableCell className="text-accent">ETB {(customer.calculatedBill ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCustomerPaymentStatus(customer.id)}
                            className="p-0 h-auto group"
                            aria-label={`Toggle payment status for ${customer.name}`}
                        >
                            <Badge variant={customer.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="whitespace-nowrap cursor-pointer hover:opacity-80">
                            {customer.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : <XCircle className="mr-1 h-3.5 w-3.5"/>}
                            {customer.paymentStatus}
                            <RefreshCcw className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                            </Badge>
                        </Button>
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
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteCustomer(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Customer
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

    