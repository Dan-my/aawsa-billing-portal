
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddMeterReadingForm } from "@/components/add-meter-reading-form";
import { useToast } from "@/hooks/use-toast";
import { addMeterReading, getCustomers, initializeCustomers, getBulkMeters, initializeBulkMeters } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { DomainMeterReading } from "@/lib/data-store";
import { format } from "date-fns";

interface User {
  id?: string; // Assuming user object stored in localStorage has an ID
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffMeterReadingsPage() {
  const { toast } = useToast();
  const [branchName, setBranchName] = React.useState<string>("Your Branch");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [bulkMeters, setBulkMeters] = React.useState<BulkMeter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setBranchName(parsedUser.branchName);
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
      setCustomers(getCustomers());
      setBulkMeters(getBulkMeters());
      setIsLoading(false);
    }).catch(error => {
      console.error("Error initializing data for meter readings page:", error);
      toast({ title: "Error Loading Data", description: "Could not load necessary customer/meter data.", variant: "destructive" });
      setIsLoading(false);
    });

  }, [toast]);

  const handleAddReadingSubmit = async (formData: { meterNumber: string; reading: number; date: Date }) => {
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information not found. Cannot save reading.",
      });
      return;
    }
    if (isLoading) {
      toast({ title: "System Busy", description: "Please wait, data is still loading."});
      return;
    }

    const { meterNumber, reading, date } = formData;

    // Try to find as individual customer meter first
    const customer = customers.find(c => c.meterNumber === meterNumber);
    let meterType: 'individual_customer_meter' | 'bulk_meter' | null = null;
    let entityId: string | undefined = undefined;

    if (customer) {
      meterType = 'individual_customer_meter';
      entityId = customer.id;
    } else {
      // If not found as customer, try to find as bulk meter
      const bulkMeter = bulkMeters.find(bm => bm.meterNumber === meterNumber);
      if (bulkMeter) {
        meterType = 'bulk_meter';
        entityId = bulkMeter.id;
      }
    }

    if (!meterType || !entityId) {
      toast({
        variant: "destructive",
        title: "Meter Not Found",
        description: `No customer or bulk meter found with meter number: ${meterNumber}.`,
      });
      return;
    }

    const readingPayload: Omit<DomainMeterReading, 'id' | 'createdAt' | 'updatedAt'> = {
      meterType: meterType,
      individualCustomerId: meterType === 'individual_customer_meter' ? entityId : null,
      bulkMeterId: meterType === 'bulk_meter' ? entityId : null,
      readerStaffId: currentUser.id,
      readingDate: format(date, "yyyy-MM-dd"), // Format to string
      monthYear: format(date, "yyyy-MM"), // Format to string
      readingValue: reading,
      isEstimate: false, // Default, can be made configurable
      notes: `Reading entered by ${currentUser.email}`, // Example note
    };

    try {
      const result = await addMeterReading(readingPayload);
      if (result.success && result.data) {
        toast({
          title: "Meter Reading Added",
          description: `Reading for meter ${meterNumber} has been successfully recorded.`,
        });
        setIsModalOpen(false); // Close modal on successful submit
        // Optionally, re-fetch meter readings if displaying them in a table
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Meter Readings ({branchName})</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search meters..." className="pl-8 w-full md:w-[250px]" />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Reading
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <UIDialogTitle>Add New Meter Reading</UIDialogTitle>
                <UIDialogDescription>
                  Enter the details for the new meter reading. Click submit when you're done.
                </UIDialogDescription>
              </DialogHeader>
              <AddMeterReadingForm onSubmit={handleAddReadingSubmit} />
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
          <p>Meter readings data table will be displayed here. This will include options to add new readings and view history.</p>
          {/* Placeholder for table */}
          <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            Meter readings table for staff coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
