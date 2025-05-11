
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UploadCloud, Building } from "lucide-react";
import { StaffBulkMeterEntryForm } from "./staff-bulk-meter-entry-form";
import { StaffIndividualCustomerEntryForm } from "./staff-individual-customer-entry-form";
import { CsvUploadSection } from "@/app/admin/data-entry/csv-upload-section";
import {
  bulkMeterDataEntrySchema,
  individualCustomerDataEntrySchema,
  type BulkMeterDataEntryFormValues,
  type IndividualCustomerDataEntryFormValues
} from "@/app/admin/data-entry/customer-data-entry-types";
import {
  addBulkMeter,
  addCustomer,
  initializeBulkMeters,
  initializeCustomers,
  getBulkMeters,
  getCustomers,
} from "@/lib/data-store";
import type { CustomerType, SewerageConnection } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { initialBulkMeters as defaultInitialBulkMeters } from "@/app/admin/bulk-meters/page";
import { initialCustomers as defaultInitialCustomers } from "@/app/admin/individual-customers/page";


const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffDataEntryPage() {
  const [staffBranchName, setStaffBranchName] = React.useState<string>("Your Branch");
  const [isBranchDetermined, setIsBranchDetermined] = React.useState(false);

  React.useEffect(() => {
    if (getBulkMeters().length === 0) initializeBulkMeters(defaultInitialBulkMeters);
    if (getCustomers().length === 0) initializeCustomers(defaultInitialCustomers);
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
        } else if (parsedUser.role === "staff" && !parsedUser.branchName) {
          setStaffBranchName("Unassigned Branch"); // Or some default/error state
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        setStaffBranchName("Error: Branch Undefined");
      }
    } else {
        setStaffBranchName("Error: Not Logged In");
    }
    setIsBranchDetermined(true);
  }, []);


  const handleBulkMeterCsvUpload = (data: BulkMeterDataEntryFormValues) => {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = {
      ...data,
      status: "Active",
      paymentStatus: "Unpaid",
    };
    addBulkMeter(bulkMeterDataForStore);
  };

  const handleIndividualCustomerCsvUpload = (data: IndividualCustomerDataEntryFormValues) => {
     const customerDataForStore = {
        ...data,
    } as Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number, sewerageConnection: SewerageConnection };
    addCustomer(customerDataForStore);
  };

  if (!isBranchDetermined) {
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold">Customer Data Entry (Loading branch info...)</h1>
             <Card className="shadow-md border-primary/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                    <Building className="h-5 w-5 animate-spin" /> Loading Branch Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please wait while we determine your assigned branch.</p>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const canProceedWithDataEntry = staffBranchName !== "Error: Not Logged In" && staffBranchName !== "Error: Branch Undefined" && staffBranchName !== "Unassigned Branch";


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Customer Data Entry ({staffBranchName})</h1>
      </div>

      {!canProceedWithDataEntry && (
        <Card className="shadow-md border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Building className="h-5 w-5" /> Branch Information Issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                {staffBranchName === "Unassigned Branch" 
                    ? "You are not assigned to a specific branch. Please contact an administrator."
                    : "Could not determine your branch. Please ensure you are logged in correctly or contact an administrator."
                }
            </p>
          </CardContent>
        </Card>
      )}

      {canProceedWithDataEntry && (
        <Tabs defaultValue="manual-individual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
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
              </CardHeader>
              <CardContent>
                <StaffIndividualCustomerEntryForm branchName={staffBranchName} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual-bulk">
            <Card className="shadow-lg mt-4">
              <CardHeader>
                <CardTitle>Bulk Meter Data Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffBulkMeterEntryForm branchName={staffBranchName} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv-upload">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Bulk Meter CSV Upload</CardTitle>
                  <CardDescription>
                    Upload a CSV file to add multiple bulk meters for {staffBranchName}.
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
                    Upload a CSV file to add multiple individual customers for {staffBranchName}.
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
      )}
    </div>
  );
}

