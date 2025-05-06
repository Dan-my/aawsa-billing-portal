import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function StaffMeterReadingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Meter Readings (Kality Branch)</h1>
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
          <CardDescription>View and manage meter readings for your assigned branch.</CardDescription>
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
