
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddMeterReadingForm, type AddMeterReadingFormValues } from "@/components/add-meter-reading-form";
import MeterReadingsTable from "@/components/meter-readings-table"; // Import the table component
import { useToast } from "@/hooks/use-toast";
import { 
  addMeterReading, 
  getCustomers, 
  initializeCustomers, 
  getBulkMeters, 
  initializeBulkMeters,
  getMeterReadings,
  initializeMeterReadings,
  subscribeToMeterReadings,
  subscribeToCustomers,
  subscribeToBulkMeters
} from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { DomainMeterReading } from "@/lib/data-store";
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
  
  const [allCustomers, setAllCustomers] = React.useState<IndividualCustomer[]>([]);
  const [allBulkMeters, setAllBulkMeters] = React.useState<BulkMeter[]>([]);
  const [allMeterReadings, setAllMeterReadings] = React.useState<DomainMeterReading[]>([]);
  const [branchMeterReadings, setBranchMeterReadings] = React.useState<DomainMeterReading[]>([]);
  
  const [customersForForm, setCustomersForForm] = React.useState<Pick<IndividualCustomer, 'id' | 'name' | 'meterNumber'>[]>([]);
  const [bulkMetersForForm, setBulkMetersForForm] = React.useState<Pick<BulkMeter, 'id' | 'name' | 'meterNumber'>[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState(""); 

  const filterAndSetData = React.useCallback((
    currentBranchNameInput: string | undefined,
    customersList: IndividualCustomer[],
    bulkMetersList: BulkMeter[],
    meterReadingsList: DomainMeterReading[]
  ) => {
    const simpleBranchName = currentBranchNameInput
      ? currentBranchNameInput.replace(/ Branch$/i, "").toLowerCase().trim()
      : undefined;

    const relevantBulkMeters = simpleBranchName
      ? bulkMetersList.filter(bm =>
          (bm.location?.toLowerCase() || "").includes(simpleBranchName) ||
          (bm.name?.toLowerCase() || "").includes(simpleBranchName) ||
          (bm.ward?.toLowerCase() || "").includes(simpleBranchName)
        )
      : bulkMetersList;
    
    setBulkMetersForForm(relevantBulkMeters.map(bm => ({ id: bm.id, name: bm.name, meterNumber: bm.meterNumber })));

    const relevantCustomers = simpleBranchName
      ? customersList.filter(c =>
          (c.location?.toLowerCase() || "").includes(simpleBranchName) ||
          (c.ward?.toLowerCase() || "").includes(simpleBranchName) ||
          (c.assignedBulkMeterId &&
            relevantBulkMeters.some(bm => bm.id === c.assignedBulkMeterId) // Check if assigned BM is in the relevant list
          )
        )
      : customersList;

    setCustomersForForm(relevantCustomers.map(c => ({ id: c.id, name: c.name, meterNumber: c.meterNumber })));

    const branchFilteredReadings = simpleBranchName
      ? meterReadingsList.filter(reading => {
          if (reading.meterType === 'individual_customer_meter' && reading.individualCustomerId) {
            return relevantCustomers.some(c => c.id === reading.individualCustomerId);
          } else if (reading.meterType === 'bulk_meter' && reading.bulkMeterId) {
            return relevantBulkMeters.some(bm => bm.id === reading.bulkMeterId);
          }
          return false;
        })
      : meterReadingsList;
      
    const sortedReadings = branchFilteredReadings.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
    setBranchMeterReadings(sortedReadings);
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
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }

    setIsLoading(true);
    Promise.all([
      initializeCustomers(),
      initializeBulkMeters(),
      initializeMeterReadings()
    ]).then(() => {
      if (!isMounted) return;

      const fetchedCustomers = getCustomers();
      const fetchedBulkMeters = getBulkMeters();
      const fetchedMeterReadings = getMeterReadings();
      
      setAllCustomers(fetchedCustomers);
      setAllBulkMeters(fetchedBulkMeters);
      setAllMeterReadings(fetchedMeterReadings);
      
      filterAndSetData(localBranchName, fetchedCustomers, fetchedBulkMeters, fetchedMeterReadings);
      
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing data for meter readings page:", error);
      toast({ title: "Error Loading Data", description: "Could not load necessary data.", variant: "destructive" });
      setIsLoading(false);
    });
    
    const unsubscribeCustomers = subscribeToCustomers((updatedCustomers) => {
        if (isMounted) {
            setAllCustomers(updatedCustomers);
            filterAndSetData(localBranchName, updatedCustomers, allBulkMeters, allMeterReadings);
        }
    });
    const unsubscribeBulkMeters = subscribeToBulkMeters((updatedBulkMeters) => {
        if (isMounted) {
            setAllBulkMeters(updatedBulkMeters);
            filterAndSetData(localBranchName, allCustomers, updatedBulkMeters, allMeterReadings);
        }
    });
    const unsubscribeMeterReadings = subscribeToMeterReadings((updatedReadings) => {
        if (isMounted) {
            setAllMeterReadings(updatedReadings);
            filterAndSetData(localBranchName, allCustomers, allBulkMeters, updatedReadings);
        }
    });
    
    return () => { 
        isMounted = false; 
        unsubscribeCustomers();
        unsubscribeBulkMeters();
        unsubscribeMeterReadings();
    };
  }, [filterAndSetData, toast]);


  const handleAddReadingSubmit = async (formData: AddMeterReadingFormValues) => {
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information not found. Cannot save reading.",
      });
      return;
    }
    
    const { entityId, meterType, reading, date } = formData;

    const readingPayload: Omit<DomainMeterReading, 'id' | 'createdAt' | 'updatedAt'> = {
      meterType: meterType,
      individualCustomerId: meterType === 'individual_customer_meter' ? entityId : null,
      bulkMeterId: meterType === 'bulk_meter' ? entityId : null,
      readerStaffId: currentUser.id,
      readingDate: format(date, "yyyy-MM-dd"),
      monthYear: format(date, "yyyy-MM"),
      readingValue: reading,
      isEstimate: false,
      notes: `Reading entered by ${currentUser.email}`,
    };

    try {
      setIsLoading(true); 
      const result = await addMeterReading(readingPayload);
      if (result.success && result.data) {
        toast({
          title: "Meter Reading Added",
          description: `Reading for selected meter has been successfully recorded.`,
        });
        setIsModalOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: result.message || "Could not record meter reading.",
        });
      }
    } catch (error) {
      console.error("Error submitting meter reading:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred while saving the reading.",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const displayedReadings = branchMeterReadings.filter(reading => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    let meterIdentifier = "";
    if (reading.meterType === 'individual_customer_meter' && reading.individualCustomerId) {
      const customer = allCustomers.find(c => c.id === reading.individualCustomerId);
      if (customer) meterIdentifier = `${customer.name} ${customer.meterNumber}`.toLowerCase();
    } else if (reading.meterType === 'bulk_meter' && reading.bulkMeterId) {
      const bulkMeter = allBulkMeters.find(bm => bm.id === reading.bulkMeterId);
      if (bulkMeter) meterIdentifier = `${bulkMeter.name} ${bulkMeter.meterNumber}`.toLowerCase();
    }
    
    return meterIdentifier.includes(lowerSearchTerm) ||
           String(reading.readingValue).includes(lowerSearchTerm) ||
           reading.readingDate.includes(lowerSearchTerm) ||
           reading.monthYear.includes(lowerSearchTerm);
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
          {isLoading && branchMeterReadings.length === 0 ? ( // Changed condition to show loading when also no readings yet
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading meter readings...
             </div>
          ) : (
            <MeterReadingsTable 
              data={displayedReadings} 
              customers={allCustomers} 
              bulkMeters={allBulkMeters}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

