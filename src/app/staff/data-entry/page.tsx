
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UploadCloud, Building, FileSpreadsheet } from "lucide-react";
import { StaffBulkMeterEntryForm } from "./staff-bulk-meter-entry-form";
import { StaffIndividualCustomerEntryForm } from "./individual-customer-data-entry-form"; 
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
} from "@/lib/data-store";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";

const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];

interface User {
  email: string;
  role: "admin" | "staff" | "Admin" | "Staff";
  branchName?: string;
}

export default function StaffDataEntryPage() {
  const [staffBranchName, setStaffBranchName] = React.useState<string>("Your Branch");
  const [isBranchDetermined, setIsBranchDetermined] = React.useState(false);

  React.useEffect(() => {
    initializeBulkMeters();
    initializeCustomers();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role.toLowerCase() === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
        } else if (parsedUser.role.toLowerCase() === "staff" && !parsedUser.branchName) {
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
    } as Omit<IndividualCustomer, 'id' | 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill'>;
    await addCustomer(customerDataForStore);
  };
  
  const downloadCsvTemplate = (headers: string[], fileName: string) => {
    const csvString = headers.join(',') + '\n';
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
                    <CardDescription>
                        Manually enter data for a single individual customer.
                    </CardDescription>
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
                    <CardDescription>
                        Manually enter data for a single bulk meter.
                    </CardDescription>
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
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <CardTitle>Bulk Meter CSV Upload</CardTitle>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadCsvTemplate(bulkMeterCsvHeaders, 'bulk_meter_template.csv')}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                            </div>
                            <CardDescription className="mt-2">
                                Upload a CSV file to add multiple bulk meters.
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <CardTitle>Individual Customer CSV Upload</CardTitle>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadCsvTemplate(individualCustomerCsvHeaders, 'individual_customer_template.csv')}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                            </div>
                            <CardDescription className="mt-2">
                                Upload a CSV file to add multiple individual customers.
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
