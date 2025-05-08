
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UploadCloud } from "lucide-react";
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
import { TARIFF_RATE } from "../individual-customers/individual-customer-types";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import { initialBulkMeters } from "../bulk-meters/page";
import { initialCustomers } from "../individual-customers/page";

// Expected CSV Headers
const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];


export default function AdminDataEntryPage() {

  React.useEffect(() => {
    // Ensure data stores are initialized with some default data if empty
    // This is important for components that might rely on existing bulk meters (e.g., for assignment)
    initializeBulkMeters(initialBulkMeters);
    initializeCustomers(initialCustomers);
  }, []);

  const handleBulkMeterCsvUpload = (data: BulkMeterDataEntryFormValues) => {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = {
      ...data,
      status: "Active" // Default status for CSV uploaded bulk meters
    };
    addBulkMeter(bulkMeterDataForStore);
  };

  const handleIndividualCustomerCsvUpload = (data: IndividualCustomerDataEntryFormValues) => {
    const usage = data.currentReading - data.previousReading;
    const calculatedBill = usage * TARIFF_RATE;
    const customerDataForStore: Omit<IndividualCustomer, 'id'> = {
      ...data,
      status: "Active",
      paymentStatus: "Unpaid",
      calculatedBill,
    };
    addCustomer(customerDataForStore);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Data Entry</h1>
      </div>

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
              <CardDescription>
                Manually enter data for a new individual customer. Ensure all required fields are filled accurately.
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
                Manually enter data for a new bulk meter. This is typically for large supply points.
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
                <CardTitle>Bulk Meter CSV Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file to add multiple bulk meters. Ensure your CSV matches the required format.
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
                  Upload a CSV file to add multiple individual customers. Ensure your CSV matches the required format.
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
