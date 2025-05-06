import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Generate Reports</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Select and generate various reports for billing, usage, and customer data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Report generation options and filters will be available here.</p>
          {/* Placeholder for report options */}
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-semibold">Billing Summary Report</h3>
              <p className="text-sm text-muted-foreground">Summary of paid and unpaid bills for a selected period.</p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-semibold">Water Usage Report</h3>
              <p className="text-sm text-muted-foreground">Detailed water consumption report by customer type or area.</p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
           <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            More report options and generation functionality coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
