
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UploadCloud, Info } from "lucide-react";
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
import type { CustomerType, SewerageConnection } from "@/lib/billing";

const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];


export default function AdminDataEntryPage() {
  React.useEffect(() => {
    initializeBulkMeters();
    initializeCustomers();
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Data Entry</h1>
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
                <CardTitle>Bulk Meter CSV Upload</CardTitle>
                <CardDescription>
                    Upload a CSV file to add multiple bulk meters. Refer to the project README.md for the required CSV format and template.
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
                    Upload a CSV file to add multiple individual customers. Refer to the project README.md for the required CSV format and template.
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
