
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Droplets, Edit, Trash2, MoreHorizontal, User, CheckCircle, XCircle, FileEdit, RefreshCcw, Gauge, Users as UsersIcon, DollarSign, TrendingUp, Clock, AlertTriangle, MinusCircle, PlusCircle as PlusCircleIcon } from "lucide-react";
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
  updateBulkMeterPaymentStatus,
  deleteBulkMeter as deleteBulkMeterFromStore,
  updateCustomer as updateCustomerInStore,
  deleteCustomer as deleteCustomerFromStore,
  subscribeToBulkMeters,
  subscribeToCustomers,
  initializeBulkMeters,
  initializeCustomers,
} from "@/lib/data-store";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer, IndividualCustomerStatus } from "@/app/admin/individual-customers/individual-customer-types";
import { calculateBill, type CustomerType, type SewerageConnection, type PaymentStatus } from "@/lib/billing";
import { BulkMeterFormDialog, type BulkMeterFormValues } from "@/app/admin/bulk-meters/bulk-meter-form-dialog";
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "@/app/admin/individual-customers/individual-customer-form-dialog";
import { cn } from "@/lib/utils";

interface UserAuth {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffBulkMeterDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bulkMeterId = params.id as string;

  const [bulkMeter, setBulkMeter] = useState<BulkMeter | null>(null);
  const [associatedCustomers, setAssociatedCustomers] = useState<IndividualCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffBranchName, setStaffBranchName] = React.useState<string | undefined>(undefined);
  const [isAuthorized, setIsAuthorized] = useState(false); 

  const [isBulkMeterFormOpen, setIsBulkMeterFormOpen] = React.useState(false);
  const [isBulkMeterDeleteDialogOpen, setIsBulkMeterDeleteDialogOpen] = React.useState(false);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  const [isCustomerDeleteDialogOpen, setIsCustomerDeleteDialogOpen] = React.useState(false);
  
  const [branchBulkMetersForCustomerForm, setBranchBulkMetersForCustomerForm] = useState<{id: string, name: string}[]>([]);


  const checkAuthorization = useCallback((meter: BulkMeter | null, branchName?: string) => {
    if (!meter || !branchName) return false;
    const simpleBranchName = branchName.replace(/ Branch$/i, "").toLowerCase().trim();
    return (
      (meter.location?.toLowerCase() || "").includes(simpleBranchName) ||
      (meter.name?.toLowerCase() || "").includes(simpleBranchName) ||
      (meter.ward?.toLowerCase() || "").includes(simpleBranchName)
    );
  }, []);

  useEffect(() => {
    let isMounted = true;
    let localBranchName: string | undefined;

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: UserAuth = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          if(isMounted) setStaffBranchName(parsedUser.branchName);
          localBranchName = parsedUser.branchName;
        }
      } catch (e) { console.error("Failed to parse user from localStorage", e); }
    }


    if (!bulkMeterId) {
      setIsLoading(false);
      setBulkMeter(null);
      toast({ title: "Invalid Bulk Meter ID", description: "The ID for the bulk meter is missing.", variant: "destructive" });
      router.push("/staff/bulk-meters");
      return;
    }

    setIsLoading(true);
    Promise.all([initializeBulkMeters(), initializeCustomers()]).then(() => {
      if (!isMounted) return;
      const currentGlobalMeters = getBulkMeters();
      const currentGlobalCustomers = getCustomers();
      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);

      if (foundBM) {
        if (checkAuthorization(foundBM, localBranchName)) {
          setBulkMeter(foundBM);
          const associated = currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId);
          setAssociatedCustomers(associated);
          setIsAuthorized(true);
          const simpleBranch = localBranchName?.replace(/ Branch$/i, "").toLowerCase().trim();
          const branchMeters = currentGlobalMeters.filter(bm => 
              simpleBranch && (
                (bm.location?.toLowerCase() || "").includes(simpleBranch) ||
                (bm.name?.toLowerCase() || "").includes(simpleBranch) ||
                (bm.ward?.toLowerCase() || "").includes(simpleBranch)
              )
          ).map(bm => ({id: bm.id, name: bm.name}));
          setBranchBulkMetersForCustomerForm(branchMeters);

        } else {
          setBulkMeter(null);
          setIsAuthorized(false);
          toast({ title: "Unauthorized", description: "You are not authorized to view this bulk meter.", variant: "destructive" });
        }
      } else {
        setBulkMeter(null);
        toast({ title: "Not Found", description: "Bulk meter not found.", variant: "destructive" });
      }
      setIsLoading(false);
    });

    const handleStoresUpdate = () => {
      if (!isMounted) return;
      const currentGlobalMeters = getBulkMeters();
      const currentGlobalCustomers = getCustomers();
      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);

      if (foundBM) {
        if (checkAuthorization(foundBM, localBranchName)) { 
            setBulkMeter(foundBM);
            const associated = currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId);
            setAssociatedCustomers(associated);
            setIsAuthorized(true);

             const simpleBranch = localBranchName?.replace(/ Branch$/i, "").toLowerCase().trim();
             const branchMeters = currentGlobalMeters.filter(bm => 
                simpleBranch && (
                    (bm.location?.toLowerCase() || "").includes(simpleBranch) ||
                    (bm.name?.toLowerCase() || "").includes(simpleBranch) ||
                    (bm.ward?.toLowerCase() || "").includes(simpleBranch)
                )
            ).map(bm => ({id: bm.id, name: bm.name}));
            setBranchBulkMetersForCustomerForm(branchMeters);

        } else {
            setBulkMeter(null);
            setIsAuthorized(false);
        }
      } else if (bulkMeter) { 
         setBulkMeter(null);
         setIsAuthorized(false); 
         toast({ title: "Bulk Meter Update", description: "The bulk meter being viewed may have been deleted or is no longer accessible.", variant: "destructive" });
      }
    };

    const unsubscribeBM = subscribeToBulkMeters(handleStoresUpdate);
    const unsubscribeCust = subscribeToCustomers(handleStoresUpdate);

    return () => {
      isMounted = false;
      unsubscribeBM();
      unsubscribeCust();
    };
  }, [bulkMeterId, router, toast, checkAuthorization, bulkMeter]); 


  const handleEditBulkMeter = () => setIsBulkMeterFormOpen(true);
  const handleDeleteBulkMeter = () => setIsBulkMeterDeleteDialogOpen(true);
  const confirmDeleteBulkMeter = async () => {
    if (bulkMeter) {
      await deleteBulkMeterFromStore(bulkMeter.id);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeter.name} has been removed.` });
      router.push("/staff/bulk-meters");
    }
    setIsBulkMeterDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeterForm = async (data: BulkMeterFormValues) => {
    if (bulkMeter) {
        const updatedBulkMeterData: BulkMeter = { id: bulkMeter.id, ...data };
        await updateBulkMeterInStore(updatedBulkMeterData);
        toast({ title: "Bulk Meter Updated", description: `${updatedBulkMeterData.name} has been updated.` });
    }
    setIsBulkMeterFormOpen(false);
  };

  const handleToggleBulkMeterPaymentStatus = async () => {
    if (bulkMeter) {
      const newStatus: PaymentStatus = bulkMeter.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
      await updateBulkMeterPaymentStatus(bulkMeter.id, newStatus);
      toast({ title: "Payment Status Updated", description: `${bulkMeter.name} payment status set to ${newStatus}.` });
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
      const updatedCustomerData: IndividualCustomer = {
          ...selectedCustomer, ...data,
          ordinal: Number(data.ordinal), meterSize: Number(data.meterSize),
          previousReading: Number(data.previousReading), currentReading: Number(data.currentReading),
          status: data.status as IndividualCustomerStatus, paymentStatus: data.paymentStatus as PaymentStatus,
          customerType: data.customerType as CustomerType, sewerageConnection: data.sewerageConnection as SewerageConnection,
          assignedBulkMeterId: data.assignedBulkMeterId || undefined,
      };
      await updateCustomerInStore(updatedCustomerData);
      toast({ title: "Customer Updated", description: `${updatedCustomerData.name} has been updated.` });
    }
    setIsCustomerFormOpen(false); setSelectedCustomer(null);
  };


  if (isLoading) return <div className="p-4 text-center">Loading bulk meter details...</div>;
  if (!isAuthorized && !isLoading) {
    return (
      <div className="p-4 text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p>You are not authorized to view this bulk meter, or it does not belong to your branch.</p>
        <Button onClick={() => router.push("/staff/bulk-meters")}>Back to Bulk Meters List</Button>
      </div>
    );
  }
  if (!bulkMeter && !isLoading) return <div className="p-4 text-center">Bulk meter not found or an error occurred.</div>;
  if (!bulkMeter) return <div className="p-4 text-center">Bulk meter data is unavailable.</div>;


  const bmPreviousReading = bulkMeter.previousReading ?? 0;
  const bmCurrentReading = bulkMeter.currentReading ?? 0;
  const bulkUsage = bmCurrentReading - bmPreviousReading;
  const effectiveBulkMeterCustomerType: CustomerType = "Non-domestic";
  const effectiveBulkMeterSewerageConnection: SewerageConnection = "No";
  const totalBulkBill = calculateBill(bulkUsage, effectiveBulkMeterCustomerType, effectiveBulkMeterSewerageConnection);

  const totalIndividualUsage = associatedCustomers.reduce((sum, cust) => sum + (cust.currentReading - cust.previousReading), 0);
  const totalIndividualBill = associatedCustomers.reduce((sum, cust) => sum + cust.calculatedBill, 0);

  const differenceUsage = bulkUsage - totalIndividualUsage;
  const differenceBill = totalBulkBill - totalIndividualBill;

  return (
    <div className="space-y-6 p-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Bulk Meter: {bulkMeter.name} ({staffBranchName})</CardTitle>
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
            <p><strong className="font-semibold">Location:</strong> {bulkMeter.location ?? 'N/A'}, {bulkMeter.ward ?? 'N/A'}</p>
            <p><strong className="font-semibold">Specific Area:</strong> {bulkMeter.specificArea ?? 'N/A'}</p>
            <p><strong className="font-semibold">Meter No:</strong> {bulkMeter.meterNumber ?? 'N/A'}</p>
            <p><strong className="font-semibold">Meter Size:</strong> {bulkMeter.meterSize} inch</p>
          </div>
          <div>
            <p><strong className="font-semibold">Customer Key:</strong> {bulkMeter.customerKeyNumber ?? 'N/A'}</p>
            <p><strong className="font-semibold">Contract No:</strong> {bulkMeter.contractNumber ?? 'N/A'}</p>
            <p><strong className="font-semibold">Month:</strong> {bulkMeter.month ?? 'N/A'}</p>
            <p><strong className="font-semibold">Readings (Prev/Curr):</strong> {(bmPreviousReading).toFixed(2)} / {(bmCurrentReading).toFixed(2)}</p>
          </div>
          <div className="space-y-1">
             <p className="text-lg"><strong className="font-semibold">Bulk Usage:</strong> {bulkUsage.toFixed(2)} m³</p>
             <p className="text-xl text-primary"><strong className="font-semibold">Total Bulk Bill:</strong> ETB {totalBulkBill.toFixed(2)}</p>
             <div className="flex items-center gap-2 mt-1">
               <strong className="font-semibold">Payment Status:</strong>
               <Button variant="ghost" size="sm" onClick={handleToggleBulkMeterPaymentStatus} className="p-0 h-auto group" aria-label={`Toggle payment status`}>
                  <Badge variant={bulkMeter.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="cursor-pointer hover:opacity-80">
                    {bulkMeter.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : <XCircle className="mr-1 h-3.5 w-3.5"/>}
                    {bulkMeter.paymentStatus}
                    <RefreshCcw className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                </Button>
             </div>
            <p className={cn("text-sm", differenceUsage < 0 ? "text-amber-600" : "text-green-600")}>
                <strong className="font-semibold">Difference Usage:</strong>
                {differenceUsage >= 0 ? <PlusCircleIcon className="inline h-3.5 w-3.5 mr-1" /> : <MinusCircle className="inline h-3.5 w-3.5 mr-1" />}
                {differenceUsage.toFixed(2)} m³
            </p>
            <p className={cn("text-sm", differenceBill < 0 ? "text-amber-600" : "text-green-600")}>
                <strong className="font-semibold">Difference Bill:</strong>
                {differenceBill >= 0 ? <PlusCircleIcon className="inline h-3.5 w-3.5 mr-1" /> : <MinusCircle className="inline h-3.5 w-3.5 mr-1" />}
                ETB {differenceBill.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" />Associated Individual Customers</CardTitle>
          <CardDescription>List of individual customers connected to this bulk meter ({associatedCustomers.length} found).</CardDescription>
        </CardHeader>
        <CardContent>
          {associatedCustomers.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No individual customers are currently associated with this bulk meter.</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead><TableHead>Meter No.</TableHead><TableHead>Usage (m³)</TableHead>
                  <TableHead>Bill (ETB)</TableHead><TableHead>Pay Status</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associatedCustomers.map((customer) => {
                    const usage = customer.currentReading - customer.previousReading;
                    return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.meterNumber}</TableCell><TableCell>{usage.toFixed(2)}</TableCell>
                      <TableCell>{customer.calculatedBill.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={ customer.paymentStatus === 'Paid' ? 'default' : customer.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary' }
                            className={cn( customer.paymentStatus === 'Paid' && "bg-green-500 hover:bg-green-600", customer.paymentStatus === 'Pending' && "bg-yellow-500 hover:bg-yellow-600" )}>
                            {customer.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : customer.paymentStatus === 'Unpaid' ? <XCircle className="mr-1 h-3.5 w-3.5"/> : <Clock className="mr-1 h-3.5 w-3.5"/>}
                            {customer.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant={customer.status === 'Active' ? 'default' : 'destructive'}>{customer.status}</Badge></TableCell>
                       <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}><Edit className="mr-2 h-4 w-4" />Edit Customer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteCustomer(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Customer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {bulkMeter && (<BulkMeterFormDialog open={isBulkMeterFormOpen} onOpenChange={setIsBulkMeterFormOpen} onSubmit={handleSubmitBulkMeterForm} defaultValues={bulkMeter}/> )}
      <AlertDialog open={isBulkMeterDeleteDialogOpen} onOpenChange={setIsBulkMeterDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Bulk Meter?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {bulkMeter?.name}. Associated customers will need reassignment.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteBulkMeter}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCustomer && (<IndividualCustomerFormDialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen} onSubmit={handleSubmitCustomerForm} defaultValues={selectedCustomer} bulkMeters={branchBulkMetersForCustomerForm} /> )}
      <AlertDialog open={isCustomerDeleteDialogOpen} onOpenChange={setIsCustomerDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Customer?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {customerToDelete?.name}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCustomer}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    