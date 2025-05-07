
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText } from "lucide-react";
import { CustomerDataEntryForm } from "./customer-data-entry-form";

export default function AdminDataEntryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Entry</h1>
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 md:w-[400px]">
          <TabsTrigger value="form"><FileText className="mr-2 h-4 w-4 inline-block"/>Form Entry</TabsTrigger>
          <TabsTrigger value="csv"><UploadCloud className="mr-2 h-4 w-4 inline-block"/>CSV Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Meter Reading & Customer Data Form Entry</CardTitle>
              <CardDescription>Enter meter readings and customer details manually for bulk or individual customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerDataEntryForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="csv">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Upload meter readings in bulk using a CSV file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" />
              </div>
              <Button>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload CSV
              </Button>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Ensure your CSV file follows the specified format. <a href="/path-to-csv-template.csv" className="text-primary hover:underline" download>Download template</a>.</p>
              </div>
               <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                CSV upload and processing functionality coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
