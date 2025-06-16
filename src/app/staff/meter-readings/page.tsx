
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddMeterReadingForm, type AddMeterReadingFormValues } from "@/components/add-meter-reading-form";
import { useToast } from "@/hooks/use-toast";
import { addMeterReading, getCustomers, initializeCustomers, getBulkMeters, initializeBulkMeters } from "@/lib/data-store";
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
  
  const [customersForForm, setCustomersForForm] = React.useState<Pick<IndividualCustomer, 'id' | 'name' | 'meterNumber'>[]>([]);
  const [bulkMetersForForm, setBulkMetersForForm] = React.useState<Pick<BulkMeter, 'id' | 'name' | 'meterNumber'>[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState(""); // For future table filtering

  React.useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("user");
    let localBranchName: string | undefined;

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (isMounted) setCurrentUser(parsedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          if (isMounted) setBranchName(parsedUser.branchName);
          localBranchName = parsedUser.branchName;
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }

    setIsLoading(true);
    Promise.all([
      initializeCustomers(),
      initializeBulkMeters()
    ]).then(() => {
      if (!isMounted) return;

      const fetchedCustomers = getCustomers();
      const fetchedBulkMeters = getBulkMeters();
      setAllCustomers(fetchedCustomers);
      setAllBulkMeters(fetchedBulkMeters);

      // Filter customers and bulk meters for the form based on branch (if applicable)
      // This is a simple filter; a more robust solution might involve direct branch_id links
      const relevantCustomers = localBranchName 
        ? fetchedCustomers.filter(c => 
            c.location?.toLowerCase().includes(localBranchName!.toLowerCase()) || 
            c.ward?.toLowerCase().includes(localBranchName!.toLowerCase()) ||
            // If customer is linked to a bulk meter, check bulk meter's branch
            (c.assignedBulkMeterId && fetchedBulkMeters.find(bm => bm.id === c.assignedBulkMeterId)?.location?.toLowerCase().includes(localBranchName!.toLowerCase()))
          )
        : fetchedCustomers;
      
      const relevantBulkMeters = localBranchName
        ? fetchedBulkMeters.filter(bm => bm.location?.toLowerCase().includes(localBranchName!.toLowerCase()))
        : fetchedBulkMeters;

      setCustomersForForm(relevantCustomers.map(c => ({ id: c.id, name: c.name, meterNumber: c.meterNumber })));
      setBulkMetersForForm(relevantBulkMeters.map(bm => ({ id: bm.id, name: bm.name, meterNumber: bm.meterNumber })));
      
      setIsLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error("Error initializing data for meter readings page:", error);
      toast({ title: "Error Loading Data", description: "Could not load necessary customer/meter data.", variant: "destructive" });
      setIsLoading(false);
    });
    
    return () => { isMounted = false; };
  }, [toast]);

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
      setIsLoading(false);
      if (result.success && result.data) {
        toast({
          title: "Meter Reading Added",
          description: `Reading for selected meter has been successfully recorded.`,
        });
        setIsModalOpen(false);
        // TODO: Re-fetch or update local list of readings if displaying them.
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: result.message || "Could not record meter reading.",
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error submitting meter reading:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred while saving the reading.",
      });
    }
  };

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
              disabled // Table and search not implemented yet
            />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
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
              {isLoading ? <p>Loading meter data...</p> : (
                (customersForForm.length === 0 && bulkMetersForForm.length === 0) ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Meters Found</AlertTitle>
                        <AlertDescription>
                            No customers or bulk meters could be loaded for your branch to add readings. Please check if data exists or contact an administrator.
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
          <CardDescription>View and manage meter readings for {branchName}. (List display coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            Meter readings table and filtering functionality will be implemented here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
