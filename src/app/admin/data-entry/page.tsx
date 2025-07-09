
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UploadCloud, Info, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkMeterDataEntryForm } from "./bulk-meter-data-entry-form";
import { IndividualCustomerDataEntryForm } from "./individual-customer-data-entry-form";
import { CsvUploadSection } from "./csv-upload-section";
import {
  bulkMeterDataEntrySchema,
  individualCustomerDataEntrySchema,
  type BulkMeterDataEntryFormValues,
  type IndividualCustomerDataEntryFormValues
} from "./customer-data-entry-types";
import { addBulkMeter, addCustomer, initializeBulkMeters, initializeCustomers } from "@/lib/data-store";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertTitle } from "@/components/ui/alert";

const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "branchId", "chargeGroup", "sewerageConnection", "xCoordinate", "yCoordinate"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId", "branchId"];


export default function AdminDataEntryPage() {
  const { hasPermission } = usePermissions();

  React.useEffect(() => {
    initializeBulkMeters();
    initializeCustomers();
  }, []);

  const handleBulkMeterCsvUpload = async (data: BulkMeterDataEntryFormValues) => {
    const bulkMeterDataForStore: Omit<BulkMeter, 'status' | 'paymentStatus' | 'outStandingbill'> = {
      ...data,
    };
    await addBulkMeter(bulkMeterDataForStore as BulkMeter);
  };

  const handleIndividualCustomerCsvUpload = async (data: IndividualCustomerDataEntryFormValues) => {
     const customerDataForStore = {
        ...data,
    } as Omit<IndividualCustomer, 'created_at' | 'updated_at' | 'status' | 'paymentStatus' | 'calculatedBill' | 'arrears'>;
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
  
  if (!hasPermission('data_entry_access')) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Customer Data Entry</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <CardDescription>You do not have permission to access the data entry page.</CardDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Customer Data Entry</h1>
      </div>

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
                    This form is designed for quick, one-off entries for admins.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <IndividualCustomerDataEntryForm />
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
                <BulkMeterDataEntryForm />
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
                    <CardDescription className="pt-2">
                       Upload multiple bulk meters at once. Ensure the CSV file structure, headers, and column order match the template exactly.
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
                    <CardDescription className="pt-2">
                       Upload multiple individual customers. Ensure the `customerKeyNumber` is unique and `assignedBulkMeterId` (if used) exists.
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
