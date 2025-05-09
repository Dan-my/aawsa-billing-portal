
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { getTariffRate, type CustomerType } from "../individual-customers/individual-customer-types";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import { initialBulkMeters } from "../bulk-meters/page";
import { initialCustomers } from "../individual-customers/page";

// Expected CSV Headers
const bulkMeterCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward"];
const individualCustomerCsvHeaders = ["name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal", "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea", "location", "ward", "sewerageConnection", "assignedBulkMeterId"];

type DataEntryType = "manual-individual" | "manual-bulk" | "csv-upload";

export default function AdminDataEntryPage() {
  const [selectedEntryType, setSelectedEntryType] = React.useState<DataEntryType>("manual-individual");

  React.useEffect(() => {
    initializeBulkMeters(initialBulkMeters);
    initializeCustomers(initialCustomers);
  }, []);

  const handleBulkMeterCsvUpload = (data: BulkMeterDataEntryFormValues) => {
    const bulkMeterDataForStore: Omit<BulkMeter, 'id'> = {
      ...data,
      status: "Active", // Default status for CSV upload
      paymentStatus: "Unpaid", // Default payment status for CSV upload
    };
    addBulkMeter(bulkMeterDataForStore);
  };

  const handleIndividualCustomerCsvUpload = (data: IndividualCustomerDataEntryFormValues) => {
    const usage = data.currentReading - data.previousReading;
    const tariff = getTariffRate(data.customerType as CustomerType);
    const calculatedBill = usage * tariff;

    const customerDataForStore: Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus' | 'status'> & { customerType: CustomerType, currentReading: number, previousReading: number } = {
      ...data,
    };
     // Casting to the expected type for addCustomer which now calculates bill and sets defaults
    addCustomer(customerDataForStore as Omit<IndividualCustomer, 'id' | 'calculatedBill' | 'paymentStatus'> & { customerType: CustomerType, currentReading: number, previousReading: number, status:any });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Data Entry</h1>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-entry-type">Select Data Entry Method</Label>
        <Select value={selectedEntryType} onValueChange={(value) => setSelectedEntryType(value as DataEntryType)}>
          <SelectTrigger id="data-entry-type" className="w-full md:w-[400px]">
            <SelectValue placeholder="Choose an entry method..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual-individual">
              <FileText className="mr-2 h-4 w-4" /> Manual Individual Customer Entry
            </SelectItem>
            <SelectItem value="manual-bulk">
              <FileText className="mr-2 h-4 w-4" /> Manual Bulk Meter Entry
            </SelectItem>
            <SelectItem value="csv-upload">
              <UploadCloud className="mr-2 h-4 w-4" /> CSV Upload
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedEntryType === "manual-individual" && (
        <Card className="shadow-lg mt-4">
          <CardHeader>
            <CardTitle>Individual Customer Data Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <IndividualCustomerDataEntryForm />
          </CardContent>
        </Card>
      )}

      {selectedEntryType === "manual-bulk" && (
        <Card className="shadow-lg mt-4">
          <CardHeader>
            <CardTitle>Bulk Meter Data Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkMeterDataEntryForm />
          </CardContent>
        </Card>
      )}
      
      {selectedEntryType === "csv-upload" && (
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
                schema={bulkMeterDataEntrySchema} // This schema is for form values, ensure it matches CSV structure or adapt
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
                schema={individualCustomerDataEntrySchema} // This schema is for form values
                addRecordFunction={handleIndividualCustomerCsvUpload}
                expectedHeaders={individualCustomerCsvHeaders}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
