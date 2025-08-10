
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; 
import { Droplets, Edit, Trash2, Menu, User, CheckCircle, XCircle, FileEdit, RefreshCcw, Gauge, Users as UsersIcon, DollarSign, TrendingUp, Clock, MinusCircle, PlusCircle as PlusCircleIcon, Printer, History, AlertTriangle, ListCollapse, Eye, MapPin } from "lucide-react";
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
  addBill, addBulkMeterReading, removeBill, getBulkMeterByCustomerKey
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
import { TablePagination } from "@/components/ui/table-pagination";

const initialMemoizedDetails = {
    bmPreviousReading: 0, bmCurrentReading: 0, bulkUsage: 0,
    totalBulkBillForPeriod: 0, totalPayable: 0, differenceUsage: 0,
    differenceBill: 0, differenceBillBreakdown: {} as BillCalculationResult,
    displayBranchName: "N/A", displayCardLocation: "N/A",
    billCardDetails: {
      prevReading: 0, currReading: 0, usage: 0, baseWaterCharge: 0,
      maintenanceFee: 0, sanitationFee: 0, sewerageCharge: 0, meterRent: 0,
      vatAmount: 0, totalDifferenceBill: 0, differenceUsage: 0,
      outstandingBill: 0, totalPayable: 0, paymentStatus: 'Unpaid' as PaymentStatus,
      month: 'N/A',
    },
    totalIndividualUsage: 0,
};

export default function BulkMeterDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bulkMeterKey = params.id as string;

  const [bulkMeter, setBulkMeter] = useState<BulkMeter | null>(null);
  const [associatedCustomers, setAssociatedCustomers] = useState<IndividualCustomer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCycle, setIsProcessingCycle] = React.useState(false);
  const [meterReadingHistory, setMeterReadingHistory] = useState<DomainBulkMeterReading[]>([]);
  const [billingHistory, setBillingHistory] = useState<DomainBill[]>([]);
  const [billForPrintView, setBillForPrintView] = React.useState<DomainBill | null>(null);
  const [currentDateTime, setCurrentDateTime] = React.useState('');

  const [isBulkMeterFormOpen, setIsBulkMeterFormOpen] = React.useState(false);
  const [isBulkMeterDeleteDialogOpen, setIsBulkMeterDeleteDialogOpen] = React.useState(false);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<IndividualCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<IndividualCustomer | null>(null);
  const [isCustomerDeleteDialogOpen, setIsCustomerDeleteDialogOpen] = React.useState(false);
  const [isAddReadingOpen, setIsAddReadingOpen] = React.useState(false);

  const [isBillDeleteDialogOpen, setIsBillDeleteDialogOpen] = React.useState(false);
  const [billToDelete, setBillToDelete] = React.useState<DomainBill | null>(null);
  
  const [showSlip, setShowSlip] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);

  // Pagination state for billing history
  const [billingHistoryPage, setBillingHistoryPage] = React.useState(0);
  const [billingHistoryRowsPerPage, setBillingHistoryRowsPerPage] = React.useState(10);

  const paginatedBillingHistory = billingHistory.slice(
    billingHistoryPage * billingHistoryRowsPerPage,
    billingHistoryPage * billingHistoryRowsPerPage + billingHistoryRowsPerPage
  );

  const [memoizedDetails, setMemoizedDetails] = React.useState(initialMemoizedDetails);

  const calculateMemoizedDetails = useCallback(async (
    currentBulkMeter: BulkMeter | null, 
    currentAssociatedCustomers: IndividualCustomer[], 
    currentBranches: Branch[], 
    currentBillingHistory: DomainBill[], 
    currentBillForPrintView: DomainBill | null
  ) => {
    if (!currentBulkMeter) {
        setMemoizedDetails(initialMemoizedDetails);
        return;
    }
  
    const bmPreviousReading = currentBulkMeter.previousReading ?? 0;
    const bmCurrentReading = currentBulkMeter.currentReading ?? 0;
    const bulkUsage = bmCurrentReading - bmPreviousReading;
  
    const effectiveBulkMeterCustomerType: CustomerType = currentBulkMeter.chargeGroup as CustomerType || "Non-domestic";
    const effectiveBulkMeterSewerageConnection: SewerageConnection = currentBulkMeter.sewerageConnection || "No";
    const billingMonth = currentBulkMeter.month || format(new Date(), 'yyyy-MM');
  
    const { totalBill: totalBulkBillForPeriod } = await calculateBill(bulkUsage, effectiveBulkMeterCustomerType, effectiveBulkMeterSewerageConnection, currentBulkMeter.meterSize, billingMonth);
  
    const outStandingBillValue = currentBulkMeter.outStandingbill ?? 0;
  
    const totalIndividualUsage = currentAssociatedCustomers.reduce((sum, cust) => sum + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);
  
    const differenceUsage = bulkUsage - totalIndividualUsage;
  
    const { totalBill: differenceBill, ...differenceBillBreakdown } = await calculateBill(differenceUsage, effectiveBulkMeterCustomerType, effectiveBulkMeterSewerageConnection, currentBulkMeter.meterSize, billingMonth);
  
    const totalPayable = differenceBill + outStandingBillValue;
    const paymentStatus = totalPayable > 0.01 ? 'Unpaid' : 'Paid';
  
    const displayBranchName = currentBulkMeter.branchId ? currentBranches.find(b => b.id === currentBulkMeter.branchId)?.name : currentBulkMeter.location;
    const displayCardLocation = currentBulkMeter.subCity || "N/A";
  
    const billToRender = currentBillForPrintView || (currentBillingHistory.length > 0 ? currentBillingHistory[0] : null);
  
    let finalBillCardDetails;
  
    if (billToRender) {
      const historicalBillDetails = await calculateBill(billToRender.differenceUsage ?? 0, currentBulkMeter.chargeGroup as CustomerType || "Non-domestic", currentBulkMeter.sewerageConnection || "No", currentBulkMeter.meterSize, billToRender.monthYear);
      finalBillCardDetails = {
        prevReading: billToRender.previousReadingValue,
        currReading: billToRender.currentReadingValue,
        usage: billToRender.usageM3 ?? 0,
        baseWaterCharge: historicalBillDetails.baseWaterCharge,
        maintenanceFee: historicalBillDetails.maintenanceFee,
        sanitationFee: historicalBillDetails.sanitationFee,
        sewerageCharge: historicalBillDetails.sewerageCharge,
        meterRent: historicalBillDetails.meterRent,
        vatAmount: historicalBillDetails.vatAmount,
        totalDifferenceBill: billToRender.totalAmountDue,
        differenceUsage: billToRender.differenceUsage ?? 0,
        outstandingBill: billToRender.balanceCarriedForward ?? 0,
        totalPayable: (billToRender.balanceCarriedForward ?? 0) + billToRender.totalAmountDue,
        paymentStatus: billToRender.paymentStatus,
        month: billToRender.monthYear,
      };
    } else {
      finalBillCardDetails = {
        prevReading: bmPreviousReading,
        currReading: bmCurrentReading,
        usage: bulkUsage,
        ...differenceBillBreakdown,
        totalDifferenceBill: differenceBill,
        differenceUsage: differenceUsage,
        outstandingBill: outStandingBillValue,
        totalPayable: totalPayable,
        paymentStatus: paymentStatus,
        month: currentBulkMeter.month || 'N/A'
      };
    }
  
    setMemoizedDetails({
      bmPreviousReading, bmCurrentReading, bulkUsage, totalBulkBillForPeriod,
      totalPayable, differenceUsage, differenceBill, differenceBillBreakdown,
      displayBranchName, displayCardLocation, billCardDetails: finalBillCardDetails, totalIndividualUsage,
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!bulkMeterKey) {
      setIsLoading(false);
      setBulkMeter(null);
      toast({ title: "Invalid Bulk Meter Key", description: "The key for the bulk meter is missing in the URL.", variant: "destructive" });
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

      const foundBM = currentGlobalMeters.find(bm => bm.customerKeyNumber === bulkMeterKey);

      if (foundBM) {
        setBulkMeter(foundBM);
        setAssociatedCustomers(currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterKey));
        setMeterReadingHistory(getBulkMeterReadings().filter(r => r.bulkMeterId === foundBM.customerKeyNumber).sort((a, b) => {
            const dateA = new Date(a.readingDate).getTime();
            const dateB = new Date(b.readingDate).getTime();
            if (dateB !== dateA) {
                return dateB - dateA;
            }
            const creationA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const creationB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return creationB - creationA;
        }));
        setBillingHistory(getBills().filter(b => b.bulkMeterId === foundBM.customerKeyNumber).sort((a, b) => {
            const dateA = new Date(b.billPeriodEndDate);
            const dateB = new Date(a.billPeriodEndDate);
            if (dateB.getTime() !== dateA.getTime()) {
              return dateB.getTime() - dateA.getTime();
            }
            const creationA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const creationB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return creationB - creationA;
          }));
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

      const foundBM = currentGlobalMeters.find(bm => bm.customerKeyNumber === bulkMeterKey);

      if (foundBM) {
        setBulkMeter(foundBM);
        setAssociatedCustomers(currentGlobalCustomers.filter(c => c.assignedBulkMeterId === bulkMeterKey));
        setMeterReadingHistory(getBulkMeterReadings().filter(r => r.bulkMeterId === foundBM.customerKeyNumber).sort((a, b) => {
            const dateA = new Date(a.readingDate).getTime();
            const dateB = new Date(b.readingDate).getTime();
            if (dateB !== dateA) {
                return dateB - dateA;
            }
            const creationA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const creationB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return creationB - creationA;
        }));
        setBillingHistory(getBills().filter(b => b.bulkMeterId === foundBM.customerKeyNumber).sort((a, b) => {
            const dateA = new Date(a.billPeriodEndDate);
            const dateB = new Date(b.billPeriodEndDate);
            if (dateB.getTime() !== dateA.getTime()) {
              return dateB.getTime() - dateA.getTime();
            }
            const creationA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const creationB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return creationB - creationA;
          }));
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
  }, [bulkMeterKey, router, toast]);

  useEffect(() => {
    calculateMemoizedDetails(bulkMeter, associatedCustomers, branches, billingHistory, billForPrintView);
  }, [bulkMeter, associatedCustomers, branches, billingHistory, billForPrintView, calculateMemoizedDetails]);

    const {
    bmPreviousReading,
    bmCurrentReading,
    bulkUsage,
    totalBulkBillForPeriod,
    totalPayable,
    differenceUsage,
    differenceBill,
    differenceBillBreakdown,
    displayBranchName,
    displayCardLocation,
    billCardDetails,
    totalIndividualUsage,
  } = memoizedDetails;
  
  const handleEditBulkMeter = () => setIsBulkMeterFormOpen(true);
  const handleDeleteBulkMeter = () => setIsBulkMeterDeleteDialogOpen(true);
  const confirmDeleteBulkMeter = async () => {
    if (bulkMeter) {
      await deleteBulkMeterFromStore(bulkMeter.customerKeyNumber);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeter.name} has been removed.` });
      router.push("/admin/bulk-meters");
    }
    setIsBulkMeterDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeterForm = async (data: BulkMeterFormValues) => {
    if (bulkMeter) {
        await updateBulkMeterInStore(bulkMeter.customerKeyNumber, data);
        toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
    }
    setIsBulkMeterFormOpen(false);
  };

  const handleAddNewReading = async (readingValue: number) => {
    if (!bulkMeter) return;
    
    const readingDate = new Date();

    const result = await addBulkMeterReading({
      bulkMeterId: bulkMeter.customerKeyNumber,
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
      await deleteCustomerFromStore(customerToDelete.customerKeyNumber);
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
    }
    setCustomerToDelete(null);
    setIsCustomerDeleteDialogOpen(false);
  };

  const handleSubmitCustomerForm = async (data: IndividualCustomerFormValues) => {
    if (selectedCustomer) {
      const updatedCustomerData: Partial<Omit<IndividualCustomer, 'customerKeyNumber'>> = {
          ...data, ordinal: Number(data.ordinal), meterSize: Number(data.meterSize),
          previousReading: Number(data.previousReading), currentReading: Number(data.currentReading), 
          status: data.status as IndividualCustomerStatus, paymentStatus: data.paymentStatus as PaymentStatus,
          customerType: data.customerType as CustomerType, sewerageConnection: data.sewerageConnection as SewerageConnection,
          assignedBulkMeterId: data.assignedBulkMeterId || undefined,
      };
      await updateCustomerInStore(selectedCustomer.customerKeyNumber, updatedCustomerData);
      toast({ title: "Customer Updated", description: `${data.name} has been updated.` });
    }
    setIsCustomerFormOpen(false); setSelectedCustomer(null);
  };

  const prepareSlipData = (bill?: DomainBill | null) => {
    if (!bulkMeter) return false;

    if (bill) {
        setBillForPrintView(bill);
    } else {
        const recentBill = billingHistory.length > 0 ? billingHistory[0] : null;
        if (recentBill) {
            setBillForPrintView(recentBill);
        } else {
            toast({
                title: "Generating Live Payslip",
                description: "No historical bill found. A payslip is being generated from the current meter data.",
            });
            const temporaryBillForPrint: DomainBill = {
                id: `payslip-${bulkMeter.customerKeyNumber}-${Date.now()}`,
                bulkMeterId: bulkMeter.customerKeyNumber,
                monthYear: bulkMeter.month || 'N/A',
                billPeriodStartDate: bulkMeter.month ? `${bulkMeter.month}-01` : 'N/A',
                billPeriodEndDate: bulkMeter.month ? format(lastDayOfMonth(parseISO(`${bulkMeter.month}-01`)), 'yyyy-MM-dd') : 'N/A',
                previousReadingValue: bmPreviousReading,
                currentReadingValue: bmCurrentReading,
                usageM3: bulkUsage,
                differenceUsage: differenceUsage,
                baseWaterCharge: differenceBillBreakdown.baseWaterCharge,
                maintenanceFee: differenceBillBreakdown.maintenanceFee,
                sanitationFee: differenceBillBreakdown.sanitationFee,
                sewerageCharge: differenceBillBreakdown.sewerageCharge,
                meterRent: differenceBillBreakdown.meterRent,
                balanceCarriedForward: bulkMeter.outStandingbill,
                totalAmountDue: differenceBill,
                dueDate: 'N/A',
                paymentStatus: billCardDetails.paymentStatus,
                notes: "Current Live Pay Slip Generation (No History Available)",
            };
            setBillForPrintView(temporaryBillForPrint);
        }
    }
    return true;
  };
  
  const handleViewSlip = () => {
    if (prepareSlipData()) {
      setShowSlip(true);
    }
  };

  const handlePrintSlip = (bill?: DomainBill | null) => {
    if (prepareSlipData(bill)) {
      setShowSlip(true);
      setIsPrinting(true);
    }
  };
  
  React.useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const handleEndOfCycle = async (carryBalance: boolean) => {
    if (!bulkMeter || isProcessingCycle) return;
    setIsProcessingCycle(true);
    
    try {
      const currentBulkMeterState = await getBulkMeterByCustomerKey(bulkMeter.customerKeyNumber);
      if(!currentBulkMeterState.success || !currentBulkMeterState.data) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch latest meter data before closing cycle." });
        setIsProcessingCycle(false);
        return;
      }
      
      const latestMeterData = currentBulkMeterState.data;
      const parsedMonth = latestMeterData.month;

      if (!parsedMonth) {
          toast({ variant: "destructive", title: "Billing Month Missing", description: "The meter does not have a billing month set." });
          setIsProcessingCycle(false);
          return;
      }

      const parsedDate = parseISO(`${parsedMonth}-01`);
      if (isNaN(parsedDate.getTime())) {
          toast({
              variant: "destructive",
              title: "Invalid Month Format",
              description: `The billing month for this meter ("${parsedMonth}") is not a valid YYYY-MM format.`,
          });
          setIsProcessingCycle(false);
          return;
      }
      
      const bmUsage = (latestMeterData.currentReading ?? 0) - (latestMeterData.previousReading ?? 0);
      const totalIndivUsage = associatedCustomers.reduce((sum, cust) => sum + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);
      const differenceUsageForCycle = bmUsage - totalIndivUsage;
      
      const chargeGroup = latestMeterData.chargeGroup as CustomerType || 'Non-domestic';
      const sewerageConn = latestMeterData.sewerageConnection || 'No';
      const { totalBill: billForDifferenceUsage, ...differenceBillBreakdownForCycle } = await calculateBill(differenceUsageForCycle, chargeGroup, sewerageConn, latestMeterData.meterSize, parsedMonth);
      
      const balanceFromPreviousPeriods = latestMeterData.outStandingbill || 0;
      const totalPayableForCycle = billForDifferenceUsage + balanceFromPreviousPeriods;
      
      const billDate = new Date();
      const periodEndDate = lastDayOfMonth(parsedDate);
      const dueDateObject = new Date(periodEndDate);
      dueDateObject.setDate(dueDateObject.getDate() + 15);
      
      const billToSave: Omit<DomainBill, 'id' | 'createdAt' | 'updatedAt'> = {
        bulkMeterId: latestMeterData.customerKeyNumber,
        billPeriodStartDate: `${parsedMonth}-01`,
        billPeriodEndDate: format(periodEndDate, 'yyyy-MM-dd'),
        monthYear: parsedMonth,
        previousReadingValue: latestMeterData.previousReading,
        currentReadingValue: latestMeterData.currentReading,
        usageM3: (latestMeterData.currentReading ?? 0) - (latestMeterData.previousReading ?? 0),
        differenceUsage: differenceUsageForCycle,
        ...differenceBillBreakdownForCycle,
        balanceCarriedForward: balanceFromPreviousPeriods,
        totalAmountDue: billForDifferenceUsage,
        dueDate: format(dueDateObject, 'yyyy-MM-dd'),
        paymentStatus: carryBalance ? 'Unpaid' : 'Paid',
        notes: `Bill generated on ${format(billDate, 'PP')}. Total payable was ${totalPayableForCycle.toFixed(2)}.`,
      };
      
      const addBillResult = await addBill(billToSave);
      if (!addBillResult.success || !addBillResult.data) {
          toast({ variant: "destructive", title: "Failed to Save Bill", description: addBillResult.message });
          setIsProcessingCycle(false);
          return;
      }

      const newOutstandingBalance = carryBalance ? totalPayableForCycle : 0;
      
      const updatePayload: Partial<Omit<BulkMeter, 'customerKeyNumber'>> = {
          previousReading: latestMeterData.currentReading,
          outStandingbill: newOutstandingBalance,
          paymentStatus: carryBalance ? 'Unpaid' : 'Paid',
      };

      const updateResult = await updateBulkMeterInStore(latestMeterData.customerKeyNumber, updatePayload);
      if (updateResult.success && updateResult.data) {
        toast({ 
            title: "Billing Cycle Closed", 
            description: carryBalance 
                ? `Total of ETB ${totalPayableForCycle.toFixed(2)} carried forward as new outstanding balance.` 
                : "Bill marked as paid and new cycle started." 
        });
      } else {
        await removeBill(addBillResult.data.id);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the meter. The new bill has been rolled back." });
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
  
  React.useEffect(() => {
    if (showSlip || isPrinting) {
      setCurrentDateTime(new Date().toLocaleString('en-US'));
    }
  }, [showSlip, isPrinting]);


  if (isLoading) return <div className="p-4 text-center">Loading bulk meter details...</div>;
  if (!bulkMeter && !isLoading) return <div className="p-4 text-center">Bulk meter not found or an error occurred.</div>;
  
  return (
    <div className="space-y-6 p-4">
      {showSlip ? (
        <Card className="printable-bill-card-wrapper">
          <CardHeader className="non-printable flex flex-row items-center justify-between">
            <CardTitle>Pay Slip Preview</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowSlip(false)}>
              <XCircle className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="printable-bill-card">
              <div className="print-header">
                <div className="print-header-top">
                  <span>{currentDateTime}</span>
                  <span>AAWSA Bulk Meter Billing Portal</span>
                </div>
                <div className="print-header-main">
                  <h1 className="font-bold tracking-wider uppercase">ADDIS ABABA WATER AND SEWERAGE AUTHORITY</h1>
                  <hr className="my-2" />
                  <div className="flex flex-row items-center justify-center gap-2 pt-1">
                    <Image src="https://veiethiopia.com/photo/partner/par2.png" alt="AAWSA Logo" width={30} height={18} className="flex-shrink-0" />
                    <h2 className="font-semibold">AAWSA Bill calculating Portal</h2>
                  </div>
                </div>
              </div>
              <div className="print-body">
                <div className="print-section">
                  <div className="print-row"><span>Bulk meter name:</span> <span>{bulkMeter.name}</span></div>
                  <div className="print-row"><span>Customer key number:</span> <span>{bulkMeter.customerKeyNumber}</span></div>
                  <div className="print-row"><span>Contract No:</span> <span>{bulkMeter.contractNumber ?? 'N/A'}</span></div>
                  <div className="print-row"><span>Branch:</span> <span>{displayBranchName ?? 'N/A'}</span></div>
                  <div className="print-row"><span>Sub-City:</span> <span>{bulkMeter.location}</span></div>
                </div>

                <div className="print-section">
                  <div className="print-row"><span>Bulk Meter Category:</span> <span>{bulkMeter.chargeGroup}</span></div>
                  <div className="print-row"><span>Sewerage Connection:</span> <span>{bulkMeter.sewerageConnection}</span></div>
                  <div className="print-row"><span>Number of Assigned Individual Customers:</span> <span>{associatedCustomers.length}</span></div>
                  <div className="print-row"><span>Previous and current reading:</span> <span>{billCardDetails.prevReading.toFixed(2)} / {billCardDetails.currReading.toFixed(2)} m³</span></div>
                  <div className="print-row"><span>Bulk usage:</span> <span>{billCardDetails.usage.toFixed(2)} m³</span></div>
                  <div className="print-row"><span>Total Individual Usage:</span> <span>{totalIndividualUsage.toFixed(2)} m³</span></div>
                </div>

                <div className="print-section">
                  <div className="print-row"><span>Base Water Charge:</span> <span>ETB {billCardDetails.baseWaterCharge.toFixed(2)}</span></div>
                  <div className="print-row"><span>Maintenance Fee:</span> <span>ETB {billCardDetails.maintenanceFee.toFixed(2)}</span></div>
                  <div className="print-row"><span>Sanitation Fee:</span> <span>ETB {billCardDetails.sanitationFee.toFixed(2)}</span></div>
                  <div className="print-row"><span>Sewerage Fee:</span> <span>ETB {billCardDetails.sewerageCharge.toFixed(2)}</span></div>
                  <div className="print-row"><span>Meter Rent:</span> <span>ETB {billCardDetails.meterRent.toFixed(2)}</span></div>
                  <div className="print-row"><span>VAT (15%):</span> <span>ETB {billCardDetails.vatAmount.toFixed(2)}</span></div>
                  <div className="print-row"><span>Difference usage:</span> <span>{billCardDetails.differenceUsage.toFixed(2)} m³</span></div>
                </div>
                
                <hr className="print-hr" />
                <div className="print-row"><span>Total Difference bill:</span> <span>ETB {billCardDetails.totalDifferenceBill.toFixed(2)}</span></div>
                <hr className="print-hr" />
                <div className="print-row"><span>Outstanding Bill (Previous Balance):</span> <span>ETB {billCardDetails.outstandingBill.toFixed(2)}</span></div>
                <hr className="print-hr" />
                <div className="print-row font-bold text-lg"><span>Total Amount Payable:</span> <span>ETB {billCardDetails.totalPayable.toFixed(2)}</span></div>
                <hr className="print-hr" />

                <div className="print-section">
                  <div className="print-row"><span>Paid/Unpaid:</span> <span>{billCardDetails.paymentStatus}</span></div>
                  <div className="print-row"><span>Month:</span> <span>{billCardDetails.month}</span></div>
                </div>

                <hr className="print-hr-dashed"/>
                
                <div className="print-signature-section">
                  <div className="print-signature-item"><span>Prepared by</span><span>...................................</span></div>
                  <div className="print-signature-item"><span>Checked by</span><span>...................................</span></div>
                  <div className="print-signature-item"><span>Approved by</span><span>...................................</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-lg non-printable">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl sm:text-2xl">Bulk Meter: {bulkMeter.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleViewSlip}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View Slip</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintSlip()}>
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Print Slip</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEditBulkMeter}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    <span>Edit Bulk Meter</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteBulkMeter} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Bulk Meter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p><strong className="font-semibold">Branch:</strong> {displayBranchName ?? 'N/A'}</p>
                <p><strong className="font-semibold">Sub-City:</strong> {bulkMeter.location ?? 'N/A'}, {bulkMeter.woreda ?? 'N/A'}</p>
                <p><strong className="font-semibold">Specific Area:</strong> {bulkMeter.specificArea ?? 'N/A'}</p>
                <p><strong className="font-semibold">Meter No:</strong> {bulkMeter.meterNumber ?? 'N/A'}</p>
                <p><strong className="font-semibold">Meter Size:</strong> {bulkMeter.meterSize} inch</p>
                {bulkMeter.xCoordinate && bulkMeter.yCoordinate && (
                  <a
                    href={`https://www.google.com/maps?q=${bulkMeter.yCoordinate},${bulkMeter.xCoordinate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline mt-1"
                  >
                    <MapPin className="mr-1 h-4 w-4" />
                    View on Map
                  </a>
                )}
              </div>
              <div>
                <p><strong className="font-semibold">Customer Key:</strong> {bulkMeter.customerKeyNumber ?? 'N/A'}</p>
                <p><strong className="font-semibold">Contract No:</strong> {bulkMeter.contractNumber ?? 'N/A'}</p>
                <p><strong className="font-semibold">Month:</strong> {bulkMeter.month ?? 'N/A'}</p>
                <p><strong className="font-semibold">Billed Readings (Prev/Curr):</strong> {(bmPreviousReading).toFixed(2)} / {(bmCurrentReading).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-lg"><strong className="font-semibold">Bulk Usage:</strong> {bulkUsage.toFixed(2)} m³</p>
                 <p className="text-lg"><strong className="font-semibold">Total Individual Usage:</strong> {totalIndividualUsage.toFixed(2)} m³</p>
                 <p className="text-xl text-primary"><strong className="font-semibold">Total Bulk Bill:</strong> ETB {totalBulkBillForPeriod.toFixed(2)}</p>
                 <p className={cn("text-sm", differenceUsage >= 0 ? "text-green-600" : "text-amber-600")}><strong className="font-semibold">Difference Usage:</strong> {differenceUsage.toFixed(2)} m³</p>
                 <p className={cn("text-sm", differenceBill >= 0 ? "text-green-600" : "text-amber-600")}><strong className="font-semibold">Difference Bill:</strong> ETB {differenceBill.toFixed(2)}</p>
                 <p className={cn("text-sm font-semibold", bulkMeter.outStandingbill > 0 ? "text-destructive" : "text-muted-foreground")}>Outstanding Bill: ETB {bulkMeter.outStandingbill.toFixed(2)}</p>
                 <p className="text-2xl font-bold text-primary">Total Amount Payable: ETB {totalPayable.toFixed(2)}</p>
                 <div className="flex items-center gap-2 mt-1">
                   <strong className="font-semibold">Payment Status:</strong>
                    <Badge variant={billCardDetails.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="cursor-pointer hover:opacity-80">
                      {billCardDetails.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : <XCircle className="mr-1 h-3.5 w-3.5"/>}
                      {billCardDetails.paymentStatus}
                    </Badge>
                 </div>
                 <div className="pt-4 mt-4 border-t space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">End of Month Actions</h4>
                    <Button size="sm" onClick={() => handleEndOfCycle(false)} disabled={isLoading || isProcessingCycle} className="w-full justify-center">
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Paid & Start New Cycle
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleEndOfCycle(true)} disabled={isLoading || isProcessingCycle} className="w-full justify-center">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Carry Balance & Start New Cycle
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg non-printable">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Reading History</CardTitle>
                        <CardDescription>Historical readings logged for this meter.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsAddReadingOpen(true)}>
                        <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Reading
                    </Button>
                </div>
            </CardHeader>
            <CardContent><div className="overflow-x-auto max-h-96">{meterReadingHistory.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Reading Value</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader><TableBody>{meterReadingHistory.map(reading => (<TableRow key={reading.id}><TableCell>{format(parseISO(reading.readingDate), "PP")}</TableCell><TableCell className="text-right">{reading.readingValue.toFixed(2)}</TableCell><TableCell className="text-xs text-muted-foreground">{reading.notes}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-sm text-center py-4">No historical readings found.</p>)}</div></CardContent>
          </Card>
    
          <Card className="shadow-lg non-printable">
            <CardHeader><CardTitle className="flex items-center gap-2"><ListCollapse className="h-5 w-5 text-primary" />Billing History</CardTitle><CardDescription>Historical bills generated for this meter.</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">{billingHistory.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Date Billed</TableHead><TableHead className="text-right">Prev. Reading</TableHead><TableHead className="text-right">Curr. Reading</TableHead><TableHead>Usage (m³)</TableHead><TableHead>Diff. Usage (m³)</TableHead><TableHead className="text-right">Outstanding (ETB)</TableHead><TableHead className="text-right">Current Bill (ETB)</TableHead><TableHead className="text-right">Total Payable (ETB)</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{paginatedBillingHistory.map(bill => {
                const usageForBill = bill.usageM3 ?? (bill.currentReadingValue - bill.previousReadingValue);
                const displayUsage = !isNaN(usageForBill) ? usageForBill.toFixed(2) : "N/A";
                
                const diffUsageValue = bill.differenceUsage ?? (usageForBill - (associatedCustomers.reduce((sum, cust) => sum + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0)));
                const displayDiffUsage = !isNaN(diffUsageValue) ? diffUsageValue.toFixed(2) : 'N/A';
                return (
                <TableRow key={bill.id}>
                  <TableCell>{bill.monthYear}</TableCell>
                  <TableCell>{format(parseISO(bill.billPeriodEndDate), "PP")}</TableCell>
                  <TableCell className="text-right">{bill.previousReadingValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{bill.currentReadingValue.toFixed(2)}</TableCell>
                  <TableCell>{displayUsage}</TableCell>
                  <TableCell className={cn("text-right", diffUsageValue < 0 ? "text-amber-600" : "text-green-600")}>{displayDiffUsage}</TableCell>
                  <TableCell className="text-right">{bill.balanceCarriedForward?.toFixed(2) ?? '0.00'}</TableCell>
                  <TableCell className="text-right font-medium">{bill.totalAmountDue.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{((bill.balanceCarriedForward ?? 0) + bill.totalAmountDue).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={bill.paymentStatus === 'Paid' ? 'default' : 'destructive'}>{bill.paymentStatus}</Badge></TableCell>
                  <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => handlePrintSlip(bill)}><Printer className="mr-2 h-4 w-4" />Print/Export Bill</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleDeleteBillingRecord(bill)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Record</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              )})}</TableBody></Table>) : (<p className="text-muted-foreground text-sm text-center py-4">No billing history found.</p>)}</div>
            </CardContent>
            {billingHistory.length > 0 && (
              <TablePagination
                count={billingHistory.length}
                page={billingHistoryPage}
                rowsPerPage={billingHistoryRowsPerPage}
                onPageChange={setBillingHistoryPage}
                onRowsPerPageChange={(value) => {
                  setBillingHistoryRowsPerPage(value);
                  setBillingHistoryPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            )}
          </Card>
    
          <Card className="shadow-lg non-printable">
            <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" />Associated Individual Customers</CardTitle><CardDescription>List of individual customers connected to this bulk meter ({associatedCustomers.length} found).</CardDescription></CardHeader>
            <CardContent>{associatedCustomers.length === 0 ? (<div className="text-center text-muted-foreground py-4">No individual customers are currently associated with this bulk meter.</div>) : (<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Customer Name</TableHead><TableHead>Meter No.</TableHead><TableHead>Usage (m³)</TableHead><TableHead>Bill (ETB)</TableHead><TableHead>Pay Status</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{associatedCustomers.map((customer) => { const usage = customer.currentReading - customer.previousReading; return (<TableRow key={customer.customerKeyNumber}><TableCell className="font-medium">{customer.name}</TableCell><TableCell>{customer.meterNumber}</TableCell><TableCell>{usage.toFixed(2)}</TableCell><TableCell>{customer.calculatedBill.toFixed(2)}</TableCell><TableCell><Badge variant={customer.paymentStatus === 'Paid' ? 'default' : customer.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'} className={cn(customer.paymentStatus === 'Paid' && "bg-green-500 hover:bg-green-600", customer.paymentStatus === 'Pending' && "bg-yellow-500 hover:bg-yellow-600")}>{customer.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : customer.paymentStatus === 'Unpaid' ? <XCircle className="mr-1 h-3.5 w-3.5"/> : <Clock className="mr-1 h-3.5 w-3.5"/>}{customer.paymentStatus}</Badge></TableCell><TableCell><Badge variant={customer.status === 'Active' ? 'default' : 'destructive'}>{customer.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => handleEditCustomer(customer)}><Edit className="mr-2 h-4 w-4" />Edit Customer</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleDeleteCustomer(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Customer</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>);})}</TableBody></Table></div>)}</CardContent>
          </Card>
        </>
      )}
      
      {bulkMeter && (<BulkMeterFormDialog open={isBulkMeterFormOpen} onOpenChange={setIsBulkMeterFormOpen} onSubmit={handleSubmitBulkMeterForm} defaultValues={bulkMeter}/> )}
      {bulkMeter && (<AddReadingDialog open={isAddReadingOpen} onOpenChange={setIsAddReadingOpen} onSubmit={handleAddNewReading} meter={bulkMeter} />)}
      <AlertDialog open={isBulkMeterDeleteDialogOpen} onOpenChange={setIsBulkMeterDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Bulk Meter?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {bulkMeter?.name}. Associated customers will need reassignment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteBulkMeter}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCustomer && (<IndividualCustomerFormDialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen} onSubmit={handleSubmitCustomerForm} defaultValues={selectedCustomer} bulkMeters={[{customerKeyNumber: bulkMeter.customerKeyNumber, name: bulkMeter.name}]} />)}
      <AlertDialog open={isCustomerDeleteDialogOpen} onOpenChange={setIsCustomerDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Customer?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {customerToDelete?.name}.</AlertDialogDescription></AlertDialogHeader>
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
            <AlertDialogCancel onClick={() => setBillToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteBillingRecord} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

