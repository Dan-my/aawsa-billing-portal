
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

export default function StaffMeterReadingsPage() {
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Meter Readings ({branchName})</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search meters..." className="pl-8 w-full md:w-[250px]" />
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Reading
          </Button>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Meter Reading List</CardTitle>
          <CardDescription>View and manage meter readings for {branchName}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Meter readings data table will be displayed here. This will include options to add new readings and view history.</p>
          {/* Placeholder for table */}
          <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            Meter readings table for staff coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
