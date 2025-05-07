"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, User, Users } from "lucide-react"; 
import { StaffIndividualCustomerEntryForm } from "./staff-individual-customer-entry-form";
import { StaffBulkMeterEntryForm } from "./staff-bulk-meter-entry-form";

import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface UserSession {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffDataEntryPage() {
  const { toast } = useToast();
  const [branchName, setBranchName] = React.useState<string>("Your Branch");
  const [activeFormTab, setActiveFormTab] = React.useState("individualStaff");

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: UserSession = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setBranchName(parsedUser.branchName);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const handleCsvUpload = () => {
    toast({
      title: "Feature Not Implemented",
      description: "CSV upload functionality is coming soon for your branch.",
      variant: "default", 
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Entry - {branchName}</h1>
      <Tabs defaultValue="formEntry" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="formEntry"><FileText className="mr-2 h-4 w-4 inline-block"/>Form Entry</TabsTrigger>
          <TabsTrigger value="csvUpload"><UploadCloud className="mr-2 h-4 w-4 inline-block"/>CSV Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="formEntry">
          <Tabs defaultValue={activeFormTab} onValueChange={setActiveFormTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 md:w-[500px] mb-6">
              <TabsTrigger value="individualStaff"><User className="mr-2 h-4 w-4 inline-block"/>Individual Customer Entry</TabsTrigger>
              <TabsTrigger value="bulkStaff"><Users className="mr-2 h-4 w-4 inline-block"/>Bulk Meter Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="individualStaff">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Individual Customer & Meter Reading Entry ({branchName})</CardTitle>
                  <CardDescription>Enter new customer details and initial readings, or update readings for existing customers in your branch.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffIndividualCustomerEntryForm branchName={branchName} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulkStaff">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Bulk Meter & Reading Entry ({branchName})</CardTitle>
                  <CardDescription>Enter new bulk meter details and initial readings, or update readings for existing bulk meters relevant to your branch.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffBulkMeterEntryForm branchName={branchName} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="csvUpload">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Upload CSV File ({branchName})</CardTitle>
              <CardDescription>Upload meter readings in bulk for your branch using a CSV file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="csv-file-staff">CSV File</label>
                <Input id="csv-file-staff" type="file" accept=".csv" />
              </div>
              <Button onClick={handleCsvUpload}>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload CSV
              </Button>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Ensure your CSV file follows the specified format for {branchName}.</p>
                <p className="mt-1">Templates for download:</p>
                <ul className="list-disc list-inside ml-4">
                  <li><a href="/path-to-individual-customer-csv-template.csv" className="text-primary hover:underline" download>Individual Customer Template</a></li>
                  <li><a href="/path-to-bulk-meter-csv-template.csv" className="text-primary hover:underline" download>Bulk Meter Template</a></li>
                </ul>
              </div>
              <div className="mt-4 p-4 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                Please note: Ensure your CSV file has a column indicating whether the entry is for an individual customer or a bulk meter. The system will process entries based on this column and the provided templates.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
