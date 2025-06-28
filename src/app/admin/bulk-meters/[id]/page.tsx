
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; 
import { Droplets, Edit, Trash2, MoreHorizontal, User, CheckCircle, XCircle, FileEdit, RefreshCcw, Gauge, Users as UsersIcon, DollarSign, TrendingUp, Clock, MinusCircle, PlusCircle as PlusCircleIcon, Printer, History, AlertTriangle, ListCollapse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  getBulkMeters, getCustomers, updateBulkMeter as updateBulkMeterInStore, deleteBulkMeter as deleteBulkMeterFromStore,
  updateCustomer as updateCustomerInStore, deleteCustomer as deleteCustomerFromStore, subscribeToBulkMeters, subscribeToCustomers,
  initializeBulkMeters, initializeCustomers, getBranches, initializeBranches, subscribeToBranches,
  getBulkMeterReadings, initializeBulkMeterReadings, subscribeToBulkMeterReadings,
  addBill, addBulkMeterReading, removeBill
} from "@/lib/data-store";
import { getBills, initializeBills, subscribeToBills } from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meter-types";
import type { IndividualCustomer, IndividualCustomerStatus } from "../../individual-customers/individual-customer-types";
import type { Branch } from "../../branches/branch-types"; 
import type { DomainBulkMeterReading, DomainBill } from "@/lib/data-store";
import { calculateBill, type CustomerType, type SewerageConnection, type PaymentStatus, type BillCalculationResult } from "@/lib/billing";
import { BulkMeterFormDialog, type BulkMeterFormValues } from "../bulk-meter-form-dialog";
import { IndividualCustomerFormDialog, type IndividualCustomerFormValues } from "../../individual-customers/individual-customer-form-dialog";
import { AddReadingDialog } from "@/components/add-reading-dialog";
import { cn } from "@/lib/utils";
import { format, parseISO, lastDayOfMonth } from "date-fns";

export default function BulkMeterDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bulkMeterId = params.id as string;

  const [bulkMeter, setBulkMeter] = useState<BulkMeter | null>(null);
  const [associatedCustomers, setAssociatedCustomers] = useState<IndividualCustomer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCycle, setIsProcessingCycle] = React.useState(false);
  const [meterReadingHistory, setMeterReadingHistory] = useState<DomainBulkMeterReading[]>([]);
  const [billingHistory, setBillingHistory] = useState<DomainBill[]>([]);

  const [isBulkMeterFormOpen, setIsBulkMeterFormOpen] = React.useState(false);
  const [isBulkMeterDeleteDialogOpen, setIsBulkMeterDeleteDialogOpen] = React.useState(false);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  const [isCustomerDeleteDialogOpen, setIsCustomerDeleteDialogOpen] = React.useState(false);
  const [isAddReadingOpen, setIsAddReadingOpen] = React.useState(false);

  const [isBillDeleteDialogOpen, setIsBillDeleteDialogOpen] = React.useState(false);
  const [billToDelete, setBillToDelete] = React.useState<DomainBill | null>(null);

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
      initializeBulkMeters(), initializeCustomers(), initializeBranches(), initializeBulkMeterReadings(), initializeBills()
    ]).then(() => {
      if (!isMounted) return;

      const currentGlobalMeters = getBulkMeters();
      const currentGlobalCustomers = getCustomers();
      const currentGlobalBranches = getBranches(); 
      setBranches(currentGlobalBranches); 

      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);

      if (foundBM) {
        setBulkMeter(foundBM);
        setAssociatedCustomers(currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId));
        setMeterReadingHistory(getBulkMeterReadings().filter(r => r.bulkMeterId === bulkMeterId).sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()));
        setBillingHistory(getBills().filter(b => b.bulkMeterId === bulkMeterId).sort((a,b) => new Date(b.billPeriodEndDate).getTime() - new Date(a.billPeriodEndDate).getTime()));
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
      const currentGlobalBranches = getBranches(); 

      setBranches(currentGlobalBranches); 

      const foundBM = currentGlobalMeters.find(bm => bm.id === bulkMeterId);

      if (foundBM) {
        setBulkMeter(foundBM);
        setAssociatedCustomers(currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterId));
        setMeterReadingHistory(getBulkMeterReadings().filter(r => r.bulkMeterId === bulkMeterId).sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()));
        setBillingHistory(getBills().filter(b => b.bulkMeterId === bulkMeterId).sort((a,b) => new Date(b.billPeriodEndDate).getTime() - new Date(a.billPeriodEndDate).getTime()));
      } else if (bulkMeter) {
         toast({ title: "Bulk Meter Update", description: "The bulk meter being viewed may have been deleted or is no longer accessible.", variant: "destructive" });
         setBulkMeter(null);
      }
    };

    const unsubBM = subscribeToBulkMeters(handleStoresUpdate);
    const unsubCust = subscribeToCustomers(handleStoresUpdate);
    const unsubBranches = subscribeToBranches(handleStoresUpdate);
    const unsubMeterReadings = subscribeToBulkMeterReadings(handleStoresUpdate);
    const unsubBills = subscribeToBills(handleStoresUpdate);

    return () => {
      isMounted = false;
      unsubBM();
      unsubCust();
      unsubBranches();
      unsubMeterReadings();
      unsubBills();
    };
  }, [bulkMeterId, router, toast, bulkMeter]);


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
        await updateBulkMeterInStore(bulkMeter.id, data);
        toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    }
    setIsBulkMeterFormOpen(false);
  };

  const handleAddNewReading = async (readingValue: number) => {
    if (!bulkMeter) return;
    
    const readingDate = new Date();

    const result = await addBulkMeterReading({
      bulkMeterId: bulkMeter.id,
      readingValue: readingValue,
      readingDate: format(readingDate, "yyyy-MM-dd"),
      monthYear: format(readingDate, "yyyy-MM"),
    });

    if (result.success) {
      toast({ title: "Reading Added", description: "The new meter reading has been saved." });
    } else {
      toast({ variant: "destructive", title: "Failed to Add Reading", description: result.message });
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
      const updatedCustomerData: Partial<Omit<IndividualCustomer, 'id'>> = {
          ...data, ordinal: Number(data.ordinal), meterSize: Number(data.meterSize),
          previousReading: Number(data.previousReading), currentReading: Number(data.currentReading), 
          status: data.status as IndividualCustomerStatus, paymentStatus: data.paymentStatus as PaymentStatus,
          customerType: data.customerType as CustomerType, sewerageConnection: data.sewerageConnection as SewerageConnection,
          assignedBulkMeterId: data.assignedBulkMeterId || undefined,
      };
      await updateCustomerInStore(selectedCustomer.id, updatedCustomerData);
      toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
    }
    setIsCustomerFormOpen(false); setSelectedCustomer(null);
  };

  const handlePrint = () => window.print();

  const handleEndOfCycle = async (carryBalance: boolean) => {
    if (!bulkMeter || !bulkMeter.month || isProcessingCycle) return;
    setIsProcessingCycle(true);
    
    try {
      const parsedDate = parseISO(`${bulkMeter.month}-01`);
      if (isNaN(parsedDate.getTime())) {
          toast({
              variant: "destructive",
              title: "Invalid Month Format",
              description: `The billing month for this meter ("${bulkMeter.month}") is not a valid YYYY-MM format.`,
          });
          setIsProcessingCycle(false);
          return;
      }
      
      const currentBulkMeterState = getBulkMeters().find(bm => bm.id === bulkMeter.id);
      if (!currentBulkMeterState) {
          toast({ variant: "destructive", title: "Meter Not Found", description: "Could not find the current state of the meter." });
          setIsProcessingCycle(false);
          return;
      }

      const bmPreviousReading = currentBulkMeterState.previousReading ?? 0;
      const bmCurrentReading = currentBulkMeterState.currentReading ?? 0;
      const bulkUsage = bmCurrentReading - bmPreviousReading;
      const effectiveBulkMeterCustomerType: CustomerType = "Non-domestic";
      const effectiveBulkMeterSewerageConnection: SewerageConnection = "No";

      const { totalBill: billForCurrentPeriod, ...billBreakdown } = calculateBill(bulkUsage, effectiveBulkMeterCustomerType, effectiveBulkMeterSewerageConnection, currentBulkMeterState.meterSize);
      
      const billDate = new Date();
      const periodEndDate = lastDayOfMonth(parsedDate);

      const dueDateObject = new Date(periodEndDate);
      dueDateObject.setDate(dueDateObject.getDate() + 15);
      
      const balanceFromPreviousPeriods = currentBulkMeterState.outStandingbill || 0;
      const totalPayableThisCycle = billForCurrentPeriod + balanceFromPreviousPeriods;

      const billToSave: Omit<DomainBill, 'id'> = {
        bulkMeterId: currentBulkMeterState.id,
        billPeriodStartDate: `${currentBulkMeterState.month}-01`,
        billPeriodEndDate: format(periodEndDate, 'yyyy-MM-dd'),
        monthYear: currentBulkMeterState.month,
        previousReadingValue: bmPreviousReading,
        currentReadingValue: bmCurrentReading,
        usageM3: bulkUsage,
        ...billBreakdown,
        balanceCarriedForward: balanceFromPreviousPeriods,
        totalAmountDue: billForCurrentPeriod,
        dueDate: format(dueDateObject, 'yyyy-MM-dd'),
        paymentStatus: carryBalance ? 'Unpaid' : 'Paid',
        notes: `Bill generated on ${format(billDate, 'PP')}. Total payable was ${totalPayableThisCycle.toFixed(2)}.`,
      };
      
      const addBillResult = await addBill(billToSave);
      if (!addBillResult.success) {
          toast({ variant: "destructive", title: "Failed to Save Bill", description: addBillResult.message });
          setIsProcessingCycle(false);
          return;
      }

      const newOutstandingBalance = carryBalance ? totalPayableThisCycle : 0;

      const updatePayload: Partial<Omit<BulkMeter, 'id'>> = {
          previousReading: currentBulkMeterState.currentReading,
          outStandingbill: newOutstandingBalance,
          paymentStatus: carryBalance ? 'Unpaid' : 'Paid',
      };

      const updateResult = await updateBulkMeterInStore(currentBulkMeterState.id, updatePayload);
      if (updateResult.success && updateResult.data) {
        setBulkMeter(updateResult.data);
        toast({ 
            title: "Billing Cycle Closed", 
            description: carryBalance 
                ? `Total of ETB ${totalPayableThisCycle.toFixed(2)} carried forward as new outstanding balance.` 
                : "Bill marked as paid and new cycle started." 
        });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the meter after creating the bill record." });
      }
      
    } catch(error) {
        console.error("Error during end of cycle process:", error);
        toast({ variant: "destructive", title: "Processing Error", description: "An unexpected error occurred while closing the billing cycle." });
    } finally {
        setIsProcessingCycle(false);
    }
  };
  
  const handleDeleteBillingRecord = (bill: DomainBill) => {
    setBillToDelete(bill);
    setIsBillDeleteDialogOpen(true);
  };

  const confirmDeleteBillingRecord = async () => {
    if (billToDelete) {
      await removeBill(billToDelete.id);
      toast({ title: "Billing Record Deleted", description: `The bill for ${billToDelete.monthYear} has been removed.` });
      setBillToDelete(null);
    }
    setIsBillDeleteDialogOpen(false);
  };


  if (isLoading) return <div className="p-4 text-center">Loading bulk meter details...</div>;
  if (!bulkMeter && !isLoading) return <div className="p-4 text-center">Bulk meter not found or an error occurred.</div>;
  if (!bulkMeter) return <div className="p-4 text-center">Bulk meter data is unavailable.</div>;

  const bmPreviousReading = bulkMeter.previousReading ?? 0;
  const bmCurrentReading = bulkMeter.currentReading ?? 0;
  const bulkUsage = bmCurrentReading - bmPreviousReading;

  const effectiveBulkMeterCustomerType: CustomerType = "Non-domestic";
  const effectiveBulkMeterSewerageConnection: SewerageConnection = "No";
  
  const billDetails: BillCalculationResult = calculateBill(bulkUsage, effectiveBulkMeterCustomerType, effectiveBulkMeterSewerageConnection, bulkMeter.meterSize);
  const totalBulkBillForPeriod = billDetails.totalBill;
  const totalPayable = totalBulkBillForPeriod + (bulkMeter.outStandingbill || 0);

  const totalIndividualUsage = associatedCustomers.reduce((sum, cust) => sum + (cust.currentReading - cust.previousReading), 0);
  const totalIndividualBill = associatedCustomers.reduce((sum, cust) => sum + cust.calculatedBill, 0);

  const differenceUsage = bulkMeter.differenceUsage ?? (bulkUsage - totalIndividualUsage);
  const differenceBill = bulkMeter.differenceBill ?? (totalBulkBillForPeriod - totalIndividualBill);
  
  const displayBranchName = bulkMeter.branchId ? branches.find(b => b.id === bulkMeter.branchId)?.name : bulkMeter.location;
  const displayCardLocation = bulkMeter.specificArea || bulkMeter.ward || "N/A";

  const mostRecentBill = billingHistory.length > 0 ? billingHistory[0] : null;


  return (
    <div className="space-y-6 p-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Bulk Meter: {bulkMeter.name}</CardTitle>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => setIsAddReadingOpen(true)} className="mr-2"><PlusCircleIcon className="mr-2 h-4 w-4" /> Add Reading</Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="mr-2"><Printer className="mr-2 h-4 w-4" /> Print / Export PDF</Button>
            <Button variant="outline" size="sm" onClick={handleEditBulkMeter} className="mr-2"><FileEdit className="mr-2 h-4 w-4" /> Edit Bulk Meter</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteBulkMeter}><Trash2 className="mr-2 h-4 w-4" /> Delete Bulk Meter</Button>
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
            <p><strong className="font-semibold">Billed Readings (Prev/Curr):</strong> {(bmPreviousReading).toFixed(2)} / {(bmCurrentReading).toFixed(2)}</p>
          </div>
          <div className="space-y-1">
             <p className="text-lg"><strong className="font-semibold">Bulk Usage:</strong> {bulkUsage.toFixed(2)} m³</p>
             <p className="text-xl text-primary"><strong className="font-semibold">Total Bulk Bill:</strong> ETB {totalBulkBillForPeriod.toFixed(2)}</p>
             <p className={cn("text-sm", differenceUsage >= 0 ? "text-green-600" : "text-amber-600")}><strong className="font-semibold">Difference Usage:</strong> {differenceUsage.toFixed(2)} m³</p>
             <p className={cn("text-sm", differenceBill >= 0 ? "text-green-600" : "text-amber-600")}><strong className="font-semibold">Difference Bill:</strong> ETB {differenceBill.toFixed(2)}</p>
             <p className={cn("text-sm font-semibold", (bulkMeter.outStandingbill || 0) > 0 ? "text-destructive" : "text-muted-foreground")}>Outstanding Bill: ETB {(bulkMeter.outStandingbill || 0).toFixed(2)}</p>
             <p className="text-2xl font-bold text-primary">Total Amount Payable: ETB {totalPayable.toFixed(2)}</p>
             <div className="flex items-center gap-2 mt-1">
               <strong className="font-semibold">Payment Status:</strong>
                <Badge variant={bulkMeter.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="cursor-pointer hover:opacity-80">
                  {bulkMeter.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : <XCircle className="mr-1 h-3.5 w-3.5"/>}
                  {bulkMeter.paymentStatus}
                </Badge>
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Reading History</CardTitle><CardDescription>Historical readings logged for this meter.</CardDescription></CardHeader>
          <CardContent><div className="overflow-x-auto max-h-96">{meterReadingHistory.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Reading Value</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader><TableBody>{meterReadingHistory.map(reading => (<TableRow key={reading.id}><TableCell>{format(parseISO(reading.readingDate), "PP")}</TableCell><TableCell className="text-right">{reading.readingValue.toFixed(2)}</TableCell><TableCell className="text-xs text-muted-foreground">{reading.notes}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-sm text-center py-4">No historical readings found.</p>)}</div></CardContent>
        </Card>
        <Card className="shadow-lg">
           <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />End of Month Actions</CardTitle><CardDescription>Close the current billing cycle for this meter. This action creates a historical bill record, updates the previous reading, and manages arrears.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4 pt-6">
             <Button onClick={() => handleEndOfCycle(false)} disabled={isLoading || isProcessingCycle}><CheckCircle className="mr-2 h-4 w-4" /> Mark Bill as Paid & Start New Cycle</Button>
             <Button variant="destructive" onClick={() => handleEndOfCycle(true)} disabled={isLoading || isProcessingCycle}><RefreshCcw className="mr-2 h-4 w-4" /> Carry Balance Forward & Start New Cycle</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><ListCollapse className="h-5 w-5 text-primary" />Billing History</CardTitle><CardDescription>Historical bills generated for this meter.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">{billingHistory.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Date Billed</TableHead><TableHead>Usage (m³)</TableHead><TableHead className="text-right">Outstanding (ETB)</TableHead><TableHead className="text-right">Current Bill (ETB)</TableHead><TableHead className="text-right">Total Payable (ETB)</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{billingHistory.map(bill => (<TableRow key={bill.id}><TableCell>{bill.monthYear}</TableCell><TableCell>{format(parseISO(bill.billPeriodEndDate), "PP")}</TableCell><TableCell>{bill.usageM3?.toFixed(2) ?? 'N/A'}</TableCell><TableCell className="text-right">{bill.balanceCarriedForward?.toFixed(2) ?? '0.00'}</TableCell><TableCell className="text-right font-medium">{bill.totalAmountDue.toFixed(2)}</TableCell><TableCell className="text-right font-bold">{((bill.balanceCarriedForward ?? 0) + bill.totalAmountDue).toFixed(2)}</TableCell><TableCell><Badge variant={bill.paymentStatus === 'Paid' ? 'default' : 'destructive'}>{bill.paymentStatus}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleDeleteBillingRecord(bill)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Record</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-sm text-center py-4">No billing history found.</p>)}</div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" />Associated Individual Customers</CardTitle><CardDescription>List of individual customers connected to this bulk meter ({associatedCustomers.length} found).</CardDescription></CardHeader>
        <CardContent>{associatedCustomers.length === 0 ? (<div className="text-center text-muted-foreground py-4">No individual customers are currently associated with this bulk meter.</div>) : (<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Customer Name</TableHead><TableHead>Meter No.</TableHead><TableHead>Usage (m³)</TableHead><TableHead>Bill (ETB)</TableHead><TableHead>Pay Status</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{associatedCustomers.map((customer) => { const usage = customer.currentReading - customer.previousReading; return (<TableRow key={customer.id}><TableCell className="font-medium">{customer.name}</TableCell><TableCell>{customer.meterNumber}</TableCell><TableCell>{usage.toFixed(2)}</TableCell><TableCell>{customer.calculatedBill.toFixed(2)}</TableCell><TableCell><Badge variant={customer.paymentStatus === 'Paid' ? 'default' : customer.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'} className={cn(customer.paymentStatus === 'Paid' && "bg-green-500 hover:bg-green-600", customer.paymentStatus === 'Pending' && "bg-yellow-500 hover:bg-yellow-600")}>{customer.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : customer.paymentStatus === 'Unpaid' ? <XCircle className="mr-1 h-3.5 w-3.5"/> : <Clock className="mr-1 h-3.5 w-3.5"/>}{customer.paymentStatus}</Badge></TableCell><TableCell><Badge variant={customer.status === 'Active' ? 'default' : 'destructive'}>{customer.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => handleEditCustomer(customer)}><Edit className="mr-2 h-4 w-4" />Edit Customer</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleDeleteCustomer(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Customer</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>);})}</TableBody></Table></div>)}</CardContent>
      </Card>

      <Card className="shadow-lg printable-bill-card">
        <CardHeader className="border-b pb-4 text-center"><h1 className="text-lg font-semibold tracking-wider uppercase">Addis Ababa Water and Sewerage Authority</h1></CardHeader>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex flex-row items-center justify-center border-b pb-3 mb-3"><Image src="https://veiethiopia.com/photo/partner/par2.png" alt="AAWSA Logo" width={60} height={37.5} className="flex-shrink-0 mr-3" /><h2 className="text-xl font-semibold">AAWSA Bill calculating Portal</h2></div>
          <div className="space-y-1.5">
            <p><strong className="font-semibold w-60 inline-block">Bulk meter name:</strong> {bulkMeter.name}</p>
            <p><strong className="font-semibold w-60 inline-block">Customer key number:</strong> {bulkMeter.customerKeyNumber}</p>
            <p><strong className="font-semibold w-60 inline-block">Contract No:</strong> {bulkMeter.contractNumber ?? 'N/A'}</p>
            <p><strong className="font-semibold w-60 inline-block">Branch:</strong> {displayBranchName ?? 'N/A'}</p>
            <p><strong className="font-semibold w-60 inline-block">Location:</strong> {displayCardLocation}</p>
            <p><strong className="font-semibold w-60 inline-block">Bulk Meter Category:</strong> Non-domestic</p>
            <p><strong className="font-semibold w-60 inline-block">Number of Assigned Individual Customers:</strong> {associatedCustomers.length}</p>
            <p><strong className="font-semibold w-60 inline-block">Previous and current reading:</strong> {bmPreviousReading.toFixed(2)} / {bmCurrentReading.toFixed(2)} m³</p>
            
            <p><strong className="font-semibold w-60 inline-block">Bulk usage:</strong> {bulkUsage.toFixed(2)} m³</p>
            <p><strong className="font-semibold w-60 inline-block">Base Water Charge:</strong> ETB {billDetails.baseWaterCharge.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">Maintenance Fee:</strong> ETB {billDetails.maintenanceFee.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">Sanitation Fee:</strong> ETB {billDetails.sanitationFee.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">Sewerage Fee:</strong> ETB {billDetails.sewerageCharge.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">Meter Rent:</strong> ETB {billDetails.meterRent.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">VAT (15%):</strong> ETB {billDetails.vatAmount.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">Difference usage:</strong> {differenceUsage.toFixed(2)} m³</p>
            <p><strong className="font-semibold w-60 inline-block">Total Difference bill:</strong> ETB {differenceBill.toFixed(2)}</p>

            <p className="border-t pt-2 mt-2"><strong className="font-semibold w-60 inline-block">Outstanding Bill (Previous Balance):</strong> ETB {(bulkMeter.outStandingbill || 0).toFixed(2)}</p>
            <p className="font-bold text-base"><strong className="font-semibold w-60 inline-block">Total Amount Payable:</strong> ETB {totalPayable.toFixed(2)}</p>
            <p><strong className="font-semibold w-60 inline-block">Paid/Unpaid:</strong> {bulkMeter.paymentStatus}</p>
            <p><strong className="font-semibold w-60 inline-block">Month:</strong> {bulkMeter.month}</p>
          </div>
          
          <div className="pt-10 space-y-6 text-sm">
            <p>Requested by: .........................................................</p>
            <p>Check by: .............................................................</p>
            <p>Approved by: ........................................................</p>
          </div>
        </CardContent>
        <CardHeader className="border-t pt-4 text-center mt-4"><h1 className="text-sm font-semibold tracking-wider uppercase">Addis Ababa Water and Sewerage Authority</h1></CardHeader>
      </Card>

      {bulkMeter && (<BulkMeterFormDialog open={isBulkMeterFormOpen} onOpenChange={setIsBulkMeterFormOpen} onSubmit={handleSubmitBulkMeterForm} defaultValues={bulkMeter}/>)}
      {bulkMeter && (<AddReadingDialog open={isAddReadingOpen} onOpenChange={setIsAddReadingOpen} onSubmit={handleAddNewReading} meter={bulkMeter} />)}
      <AlertDialog open={isBulkMeterDeleteDialogOpen} onOpenChange={setIsBulkMeterDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure you want to delete this bulk meter?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the bulk meter: {bulkMeter?.name}. Associated individual customers will need to be reassigned.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteBulkMeter}>Delete Bulk Meter</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCustomer && bulkMeter && (<IndividualCustomerFormDialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen} onSubmit={handleSubmitCustomerForm} defaultValues={selectedCustomer} bulkMeters={[{id: bulkMeter.id, name: bulkMeter.name}]}/>)}
      <AlertDialog open={isCustomerDeleteDialogOpen} onOpenChange={setIsCustomerDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure you want to delete this customer?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the customer: {customerToDelete?.name}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCustomer}>Delete Customer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBillDeleteDialogOpen} onOpenChange={setIsBillDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the billing record for {billToDelete?.monthYear}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBillToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBillingRecord} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
