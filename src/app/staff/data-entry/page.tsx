
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, UploadCloud, Building, ChevronDown } from "lucide-react";
import { StaffBulkMeterEntryForm } from "./staff-bulk-meter-entry-form";
import { StaffIndividualCustomerEntryForm } from "./staff-individual-customer-entry-form";
import { CsvUploadSection } from "@/app/admin/data-entry/csv-upload-section"; // Re-use admin component
import {
  bulkMeterDataEntrySchema,
  individualCustomerDataEntrySchema, // Use the restored complex schema
  type BulkMeterDataEntryFormValues,
  type IndividualCustomerDataEntryFormValues // Use the restored complex form values
} from "@/app/admin/data-entry/customer-data-entry-types";
import {
  addBulkMeter,
  addCustomer,
  initializeBulkMeters,
  initializeCustomers,
  getBulkMeters,
  getCustomers,
} from "@/lib/data-store";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";

const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
// Updated CSV headers for individual customers to match the restored complex schema
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

type DataEntryType = "manual-individual" | "manual-bulk" | "csv-upload";

const entryTypeLabels: Record<DataEntryType, string> = {
  "manual-individual": "Individual (Manual)",
  "manual-bulk": "Bulk Meter (Manual)",
  "csv-upload": "CSV Upload",
};

export default function StaffDataEntryPage() {
  const [staffBranchName, setStaffBranchName] = React.useState<string>("Your Branch");
  const [isBranchDetermined, setIsBranchDetermined] = React.useState(false);
  const [selectedEntryType, setSelectedEntryType] = React.useState<DataEntryType>("manual-individual");

  React.useEffect(() => {
    // Initialize data stores (they handle fetching from Supabase if needed)
    initializeBulkMeters();
    initializeCustomers();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
        } else if (parsedUser.role === "staff" && !parsedUser.branchName) {
          setStaffBranchName("Unassigned Branch");
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


  const handleBulkMeterCsvUpload = async (data: BulkMeterDataEntryFormValues) => {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = {
      ...data,
      status: "Active",
      paymentStatus: "Unpaid",
    };
    await addBulkMeter(bulkMeterDataForStore);
  };

  const handleIndividualCustomerCsvUpload = async (data: IndividualCustomerDataEntryFormValues) => {
     const customerDataForStore = {
        ...data,
        // status, paymentStatus, calculatedBill are handled by addCustomer in data-store or DB
    } as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'>;
    await addCustomer(customerDataForStore);
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
        {canProceedWithDataEntry && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                {selectedEntryType === "manual-individual" && <FileText className="mr-2 h-4 w-4" />}
                {selectedEntryType === "manual-bulk" && <FileText className="mr-2 h-4 w-4" />}
                {selectedEntryType === "csv-upload" && <UploadCloud className="mr-2 h-4 w-4" />}
                {entryTypeLabels[selectedEntryType]}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full md:w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuItem onClick={() => setSelectedEntryType("manual-individual")}>
                <FileText className="mr-2 h-4 w-4" />
                Individual (Manual)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedEntryType("manual-bulk")}>
                <FileText className="mr-2 h-4 w-4" />
                Bulk Meter (Manual)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedEntryType("csv-upload")}>
                <UploadCloud className="mr-2 h-4 w-4" />
                CSV Upload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
        <div className="mt-4">
          {selectedEntryType === "manual-individual" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Individual Customer Data Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffIndividualCustomerEntryForm branchName={staffBranchName} />
              </CardContent>
            </Card>
          )}

          {selectedEntryType === "manual-bulk" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bulk Meter Data Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffBulkMeterEntryForm branchName={staffBranchName} />
              </CardContent>
            </Card>
          )}

          {selectedEntryType === "csv-upload" && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    schema={individualCustomerDataEntrySchema} // Use restored complex schema
                    addRecordFunction={handleIndividualCustomerCsvUpload}
                    expectedHeaders={individualCustomerCsvHeaders} // Use restored complex headers
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
