
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
  getBranches,
  subscribeToBranches,
  initializeBranches,
} from "@/lib/data-store";
import type { CustomerType, SewerageConnection } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import { initialBulkMeters as defaultInitialBulkMeters } from "@/app/admin/bulk-meters/page";
import { initialCustomers as defaultInitialCustomers } from "@/app/admin/individual-customers/page";
import { initialBranchesData as defaultInitialBranches } from "@/app/admin/branches/page";
import type { Branch } from "@/app/admin/branches/branch-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffDataEntryPage() {
  const [availableBranches, setAvailableBranches] = React.useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (getBulkMeters().length === 0) initializeBulkMeters(defaultInitialBulkMeters);
    if (getCustomers().length === 0) initializeCustomers(defaultInitialCustomers);
    if (getBranches().length === 0) initializeBranches(defaultInitialBranches);

    const currentBranches = getBranches();
    setAvailableBranches(currentBranches);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          const staffDefaultBranch = currentBranches.find(b => b.name === parsedUser.branchName);
          if (staffDefaultBranch) {
            setSelectedBranchId(staffDefaultBranch.id);
          }
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }

    const unsubscribeBranches = subscribeToBranches((updatedBranches) => {
      setAvailableBranches(updatedBranches);
      if (selectedBranchId && !updatedBranches.some(b => b.id === selectedBranchId)) {
        setSelectedBranchId(undefined); // Clear selection if selected branch is removed
      }
    });

    return () => {
      unsubscribeBranches();
    };
  }, [selectedBranchId]); // Depend on selectedBranchId to re-verify it exists if branch list changes

  const selectedBranch = availableBranches.find(b => b.id === selectedBranchId);
  const displayBranchName = selectedBranch ? selectedBranch.name : "Select a Branch";

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

  const canProceedWithDataEntry = !!selectedBranchId && availableBranches.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Customer Data Entry ({displayBranchName})</h1>
        <div className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px]">
          <Label htmlFor="branch-select-staff" className="sr-only">Select Branch</Label>
          <Select
            value={selectedBranchId}
            onValueChange={(value) => setSelectedBranchId(value === "none" ? undefined : value)}
          >
            <SelectTrigger id="branch-select-staff" className="w-full">
              <SelectValue placeholder="Select a branch..." />
            </SelectTrigger>
            <SelectContent>
              {availableBranches.length > 0 ? (
                availableBranches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No branches available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!canProceedWithDataEntry && availableBranches.length > 0 && (
        <Card className="shadow-md border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building className="h-5 w-5" /> Please Select a Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need to select a branch from the dropdown above to proceed with data entry.</p>
          </CardContent>
        </Card>
      )}

       {availableBranches.length === 0 && (
         <Card className="shadow-md border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Building className="h-5 w-5" /> No Branches Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">There are no branches configured in the system. Please contact an administrator to add branches before proceeding with data entry.</p>
          </CardContent>
        </Card>
      )}

      {canProceedWithDataEntry && (
        <Tabs defaultValue="manual-individual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="manual-individual" disabled={!canProceedWithDataEntry}>
              <FileText className="mr-2 h-4 w-4" /> Individual (Manual)
            </TabsTrigger>
            <TabsTrigger value="manual-bulk" disabled={!canProceedWithDataEntry}>
              <FileText className="mr-2 h-4 w-4" /> Bulk Meter (Manual)
            </TabsTrigger>
            <TabsTrigger value="csv-upload" disabled={!canProceedWithDataEntry}>
              <UploadCloud className="mr-2 h-4 w-4" /> CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual-individual">
            <Card className="shadow-lg mt-4">
              <CardHeader>
                <CardTitle>Individual Customer Data Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffIndividualCustomerEntryForm branchName={selectedBranch?.name || "Selected Branch"} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual-bulk">
            <Card className="shadow-lg mt-4">
              <CardHeader>
                <CardTitle>Bulk Meter Data Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffBulkMeterEntryForm branchName={selectedBranch?.name || "Selected Branch"} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv-upload">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Bulk Meter CSV Upload</CardTitle>
                  <CardDescription>
                    Upload a CSV file to add multiple bulk meters for {selectedBranch?.name || "the selected branch"}.
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
                    Upload a CSV file to add multiple individual customers for {selectedBranch?.name || "the selected branch"}.
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

