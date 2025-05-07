
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Upload } from "lucide-react"; // Assuming Users icon for Bulk Meter group
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndividualCustomerDataEntryForm } from "./individual-customer-data-entry-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BulkMeterDataEntryForm } from "./bulk-meter-data-entry-form";
import { useToast } from "@/hooks/use-toast";

export default function AdminDataEntryPage() {
  const { toast } = useToast();

  const handleCsvUploadPlaceholder = (type: string) => {
    toast({
      title: "CSV Upload (Coming Soon)",
      description: `Functionality to upload ${type} data via CSV is under development.`,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Data Entry</h1>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual"><User className="mr-2"/> Manual Entry</TabsTrigger>
          <TabsTrigger value="csv"><Upload className="mr-2"/> CSV Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Individual Customer Data Entry</CardTitle>
                <CardDescription>Enter new individual customer details and initial meter readings manually.</CardDescription>
              </CardHeader>
              <CardContent><IndividualCustomerDataEntryForm /></CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bulk Meter Data Entry</CardTitle>
                <CardDescription>Enter new bulk meter details and initial meter readings manually.</CardDescription>
              </CardHeader>
              <CardContent><BulkMeterDataEntryForm /></CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="csv" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Upload Individual Customer Data (CSV)</CardTitle>
                <CardDescription>Upload a CSV file containing individual customer details and initial meter readings.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Input type="file" accept=".csv" />
                <Button onClick={() => handleCsvUploadPlaceholder("Individual Customers")}>
                  <Upload className="mr-2"/> Upload Individual Customers
                </Button>
                 <p className="text-sm text-muted-foreground">Accepted format: CSV</p>
                 <a href="/templates/individual_customer_template.csv" download className="text-sm text-primary hover:underline">Download Template</a>
              </CardContent>
            </Card>
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Upload Bulk Meter Data (CSV)</CardTitle>
                <CardDescription>Upload a CSV file containing bulk meter details and initial meter readings.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                 <Input type="file" accept=".csv" />
                 <Button onClick={() => handleCsvUploadPlaceholder("Bulk Meters")}>
                    <Upload className="mr-2"/> Upload Bulk Meters
                 </Button>
                 <p className="text-sm text-muted-foreground">Accepted format: CSV</p>
                 <a href="/templates/bulk_meter_template.csv" download className="text-sm text-primary hover:underline">Download Template</a>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

