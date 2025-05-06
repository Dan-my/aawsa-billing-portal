import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCog } from "lucide-react";

export default function StaffManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>Manage staff accounts, roles, and branch assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Staff data table with CRUD operations will be displayed here.</p>
          {/* Placeholder for table */}
          <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            Staff management table and functionality coming soon. <UserCog className="inline-block ml-2 h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
