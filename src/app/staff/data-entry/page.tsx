
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText } from "lucide-react";

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffDataEntryPage() {
  const [branchName, setBranchName] = React.useState<string>("Your Branch");

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setBranchName(parsedUser.branchName);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Entry - {branchName}</h1>
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="form"><FileText className="mr-2 h-4 w-4 inline-block"/>Form Entry</TabsTrigger>
          <TabsTrigger value="csv"><UploadCloud className="mr-2 h-4 w-4 inline-block"/>CSV Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Meter Reading Form Entry ({branchName})</CardTitle>
              <CardDescription>Enter meter readings manually for customers in your branch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>A form for data entry specific to your branch will be available here.</p>
              {/* Placeholder for form fields */}
              <div className="space-y-2">
                <Label htmlFor="customer-key">Customer Key Number</Label>
                <Input id="customer-key" placeholder="Enter customer key number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-reading-staff">Current Reading</Label>
                <Input id="current-reading-staff" type="number" placeholder="Enter current reading" />
              </div>
              <Button>Submit Reading</Button>
               <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Branch-specific data entry form coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="csv">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Upload CSV File ({branchName})</CardTitle>
              <CardDescription>Upload meter readings in bulk for your branch using a CSV file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file-staff">CSV File</Label>
                <Input id="csv-file-staff" type="file" accept=".csv" />
              </div>
              <Button>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload CSV
              </Button>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Ensure your CSV file follows the specified format for {branchName}. <a href="/path-to-branch-csv-template.csv" className="text-primary hover:underline" download>Download template</a>.</p>
              </div>
              <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Branch-specific CSV upload and processing functionality coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
