
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users } from "lucide-react"; // User for individual, Users for bulk/group
import { IndividualCustomerDataEntryForm } from "./individual-customer-data-entry-form";
import { BulkMeterDataEntryForm } from "./bulk-meter-data-entry-form";

export default function AdminDataEntryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Entry</h1>
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="individual"><User className="mr-2 h-4 w-4 inline-block"/>Individual Customer</TabsTrigger>
          <TabsTrigger value="bulk"><Users className="mr-2 h-4 w-4 inline-block"/>Bulk Meter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Individual Customer & Meter Reading Entry</CardTitle>
              <CardDescription>Enter meter readings and details for an individual customer.</CardDescription>
            </CardHeader>
            <CardContent>
              <IndividualCustomerDataEntryForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Bulk Meter & Reading Entry</CardTitle>
              <CardDescription>Enter readings and details for a bulk meter.</CardDescription>
            </CardHeader>
            <CardContent>
              <BulkMeterDataEntryForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
