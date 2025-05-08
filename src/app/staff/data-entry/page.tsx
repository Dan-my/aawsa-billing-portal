
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UploadCloud } from "lucide-react";
import { StaffBulkMeterEntryForm } from "./staff-bulk-meter-entry-form";
import { StaffIndividualCustomerEntryForm } from "./staff-individual-customer-entry-form";
import { CsvUploadSection } from "@/app/admin/data-entry/csv-upload-section"; // Re-use admin component
import { 
  bulkMeterDataEntrySchema, 
  individualCustomerDataEntrySchema,
  type BulkMeterDataEntryFormValues,
  type IndividualCustomerDataEntryFormValues
} from "@/app/admin/data-entry/customer-data-entry-types"; // Re-use admin types
import { addBulkMeter, addCustomer, initializeBulkMeters, initializeCustomers, getBulkMeters, getCustomers } from "@/lib/data-store";
import { TARIFF_RATE } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { initialBulkMeters as defaultInitialBulkMeters } from "@/app/admin/bulk-meters/page";
import { initialCustomers as defaultInitialCustomers } from "@/app/admin/individual-customers/page";

// Expected CSV Headers (re-using from admin for consistency)
const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffDataEntryPage() {
  const [branchName, setBranchName] = React.useState<string>("Your Branch");

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setBranchName(parsedUser.branchName);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
    // Initialize data stores if they are empty
     if (getBulkMeters().length === 0) {
        initializeBulkMeters(defaultInitialBulkMeters);
    }
    if (getCustomers().length === 0) {
        initializeCustomers(defaultInitialCustomers);
    }
  }, []);


  const handleBulkMeterCsvUpload = (data: BulkMeterDataEntryFormValues) => {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = {
      ...data,
      // Potentially use branchName for location if applicable, or add a branch field to bulk meter
      // location: data.location || branchName, 
      status: "Active"
    };
    addBulkMeter(bulkMeterDataForStore);
  };

  const handleIndividualCustomerCsvUpload = (data: IndividualCustomerDataEntryFormValues) => {
    const usage = data.currentReading - data.previousReading;
    const calculatedBill = usage * TARIFF_RATE;
    const customerDataForStore: Omit<IndividualCustomer, 'id'> = {
      ...data,
      // Potentially use branchName for location if applicable
      // location: data.location || branchName,
      status: "Active",
      paymentStatus: "Unpaid",
      calculatedBill,
    };
    addCustomer(customerDataForStore);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customer Data Entry ({branchName})</h1>
      
      <Tabs defaultValue="manual-individual" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
          <TabsTrigger value="manual-individual">
            <FileText className="mr-2 h-4 w-4" /> Individual (Manual)
          </TabsTrigger>
          <TabsTrigger value="manual-bulk">
            <FileText className="mr-2 h-4 w-4" /> Bulk Meter (Manual)
          </TabsTrigger>
          <TabsTrigger value="csv-upload">
            <UploadCloud className="mr-2 h-4 w-4" /> CSV Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual-individual">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Individual Customer Data Entry</CardTitle>
              <CardDescription>Manually enter data for a new individual customer in {branchName}.</CardDescription>
            </CardHeader>
            <CardContent>
              <StaffIndividualCustomerEntryForm branchName={branchName} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual-bulk">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Bulk Meter Data Entry</CardTitle>
              <CardDescription>Manually enter data for a new bulk meter in {branchName}.</CardDescription>
            </CardHeader>
            <CardContent>
              <StaffBulkMeterEntryForm branchName={branchName} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv-upload">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bulk Meter CSV Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file to add multiple bulk meters for {branchName}. Ensure your CSV matches the required format.
                  Expected columns: {bulkMeterCsvHeaders.join(', ')}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvUploadSection
                  entryType="bulk"
                  schema={bulkMeterDataEntrySchema}
                  addRecordFunction={handleBulkMeterCsvUpload}
                  expectedHeaders={bulkMeterCsvHeaders}
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Individual Customer CSV Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file to add multiple individual customers for {branchName}. Ensure your CSV matches the required format.
                  Expected columns: {individualCustomerCsvHeaders.join(', ')}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvUploadSection
                  entryType="individual"
                  schema={individualCustomerDataEntrySchema}
                  addRecordFunction={handleIndividualCustomerCsvUpload}
                  expectedHeaders={individualCustomerCsvHeaders}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
