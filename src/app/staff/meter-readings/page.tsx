
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddMeterReadingForm, type AddMeterReadingFormValues } from "@/components/add-meter-reading-form";
import MeterReadingsTable from "@/components/meter-readings-table";
import { useToast } from "@/hooks/use-toast";
import { 
  addIndividualCustomerReading,
  addBulkMeterReading,
  getCustomers, 
  initializeCustomers, 
  getBulkMeters, 
  initializeBulkMeters,
  getIndividualCustomerReadings,
  initializeIndividualCustomerReadings,
  subscribeToIndividualCustomerReadings,
  getBulkMeterReadings,
  initializeBulkMeterReadings,
  subscribeToBulkMeterReadings,
  subscribeToCustomers,
  subscribeToBulkMeters
} from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { DisplayReading } from "@/lib/data-store";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface User {
  id?: string;
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffMeterReadingsPage() {
  const { toast } = useToast();
  const [branchName, setBranchName] = React.useState<string>("Your Branch");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  
  const [allCombinedReadings, setAllCombinedReadings] = React.useState<DisplayReading[]>([]);
  
  const [customersForForm, setCustomersForForm] = React.useState<Pick<IndividualCustomer, 'id' | 'name' | 'meterNumber'>[]>([]);
  const [bulkMetersForForm, setBulkMetersForForm] = React.useState<Pick<BulkMeter, 'id' | 'name' | 'meterNumber'>[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState(""); 

  const combineAndSortReadings = React.useCallback((currentBranchName?: string) => {
    const allCustomers = getCustomers();
    const allBulkMeters = getBulkMeters();
    const allIndividualReadings = getIndividualCustomerReadings();
    const allBulkReadings = getBulkMeterReadings();

    const simpleBranchName = currentBranchName ? currentBranchName.replace(/ Branch$/i, "").toLowerCase().trim() : undefined;

    const branchBulkMeters = simpleBranchName ? allBulkMeters.filter(bm => (bm.location?.toLowerCase() || "").includes(simpleBranchName) || (bm.name?.toLowerCase() || "").includes(simpleBranchName)) : [];
    const branchCustomers = simpleBranchName ? allCustomers.filter(c => (c.location?.toLowerCase() || "").includes(simpleBranchName) || (c.assignedBulkMeterId && branchBulkMeters.some(bm => bm.id === c.assignedBulkMeterId))) : [];

    setBulkMetersForForm(branchBulkMeters.map(bm => ({ id: bm.id, name: bm.name, meterNumber: bm.meterNumber })));
    setCustomersForForm(branchCustomers.map(c => ({ id: c.id, name: c.name, meterNumber: c.meterNumber })));

    const displayedIndividualReadings: DisplayReading[] = allIndividualReadings
      .filter(r => branchCustomers.some(c => c.id === r.individualCustomerId))
      .map(r => ({
        id: r.id,
        meterId: r.individualCustomerId,
        meterType: 'individual',
        meterIdentifier: allCustomers.find(c => c.id === r.individualCustomerId)?.name || `Cust ID ${r.individualCustomerId}`,
        readingValue: r.readingValue, readingDate: r.readingDate, monthYear: r.monthYear, notes: r.notes
      }));

    const displayedBulkReadings: DisplayReading[] = allBulkReadings
      .filter(r => branchBulkMeters.some(bm => bm.id === r.bulkMeterId))
      .map(r => ({
        id: r.id,
        meterId: r.bulkMeterId,
        meterType: 'bulk',
        meterIdentifier: allBulkMeters.find(bm => bm.id === r.bulkMeterId)?.name || `BM ID ${r.bulkMeterId}`,
        readingValue: r.readingValue, readingDate: r.readingDate, monthYear: r.monthYear, notes: r.notes
      }));

    const combined = [...displayedIndividualReadings, ...displayedBulkReadings];
    combined.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
    setAllCombinedReadings(combined);

  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("user");
    let localBranchName: string | undefined;

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (isMounted) {
            setCurrentUser(parsedUser);
            if (parsedUser.role === "staff" && parsedUser.branchName) {
              setBranchName(parsedUser.branchName);
              localBranchName = parsedUser.branchName;
            }
        }
      } catch (e) { console.error("Failed to parse user from localStorage", e); }
    }

    setIsLoading(true);
    Promise.all([
      initializeCustomers(),
      initializeBulkMeters(),
      initializeIndividualCustomerReadings(),
      initializeBulkMeterReadings(),
    ]).then(() => {
      if (!isMounted) return;
      combineAndSortReadings(localBranchName);
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing data:", error);
      toast({ title: "Error Loading Data", variant: "destructive" });
      setIsLoading(false);
    });
    
    const unsubIndiReadings = subscribeToIndividualCustomerReadings(() => { if(isMounted) combineAndSortReadings(localBranchName); });
    const unsubBulkReadings = subscribeToBulkMeterReadings(() => { if(isMounted) combineAndSortReadings(localBranchName); });
    
    return () => { isMounted = false; unsubIndiReadings(); unsubBulkReadings(); };
  }, [toast, combineAndSortReadings]);


  const handleAddReadingSubmit = async (formData: AddMeterReadingFormValues) => {
    if (!currentUser?.id) {
      toast({ variant: "destructive", title: "Error", description: "User information not found." });
      return;
    }
    
    const { entityId, meterType, reading, date } = formData;
    
    setIsLoading(true);
    let result;

    try {
      if (meterType === 'individual_customer_meter') {
        result = await addIndividualCustomerReading({
          individualCustomerId: entityId,
          readerStaffId: currentUser.id,
          readingDate: format(date, "yyyy-MM-dd"),
          monthYear: format(date, "yyyy-MM"),
          readingValue: reading,
          notes: `Reading by ${currentUser.email}`,
        });
      } else {
        result = await addBulkMeterReading({
          bulkMeterId: entityId,
          readerStaffId: currentUser.id,
          readingDate: format(date, "yyyy-MM-dd"),
          monthYear: format(date, "yyyy-MM"),
          readingValue: reading,
          notes: `Reading by ${currentUser.email}`,
        });
      }

      if (result.success) {
        toast({ title: "Meter Reading Added", description: `Reading has been recorded.` });
        setIsModalOpen(false);
      } else {
        toast({ variant: "destructive", title: "Submission Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Error", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const displayedReadings = allCombinedReadings.filter(reading => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return reading.meterIdentifier.toLowerCase().includes(lowerSearchTerm) ||
           String(reading.readingValue).includes(lowerSearchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Meter Readings ({branchName})</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search readings..." 
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading && (customersForForm.length === 0 && bulkMetersForForm.length === 0)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <UIDialogTitle>Add New Meter Reading</UIDialogTitle>
                <UIDialogDescription>
                  Select the meter type, then the specific meter, and enter the reading details.
                </UIDialogDescription>
              </DialogHeader>
              {(isLoading && (customersForForm.length === 0 && bulkMetersForForm.length === 0)) ? <p>Loading meter data...</p> : (
                (!isLoading && customersForForm.length === 0 && bulkMetersForForm.length === 0) ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Meters Found</AlertTitle>
                        <AlertDescription>
                            No customers or bulk meters could be loaded for your branch ({branchName}) to add readings. Please check if data exists or contact an administrator.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <AddMeterReadingForm 
                        onSubmit={handleAddReadingSubmit} 
                        customers={customersForForm}
                        bulkMeters={bulkMetersForForm}
                        isLoading={isLoading}
                    />
                )
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Meter Reading List</CardTitle>
          <CardDescription>View and manage meter readings for {branchName}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && displayedReadings.length === 0 ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading meter readings...
             </div>
          ) : (
            <MeterReadingsTable data={displayedReadings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
