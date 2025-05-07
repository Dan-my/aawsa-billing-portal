
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ReportType {
  id: string;
  name: string;
  description: string;
}

const availableReports: ReportType[] = [
  {
    id: "billing-summary",
    name: "Billing Summary Report",
    description: "Summary of paid and unpaid bills for a selected period. Includes totals, payment rates, and overdue amounts.",
  },
  {
    id: "water-usage",
    name: "Water Usage Report",
    description: "Detailed water consumption report by customer type, branch, or geographical area. Helps identify trends and anomalies.",
  },
  {
    id: "customer-data",
    name: "Customer Data Report",
    description: "Comprehensive list of customers, including contact details, meter information, and account status.",
  },
  {
    id: "payment-history",
    name: "Payment History Report",
    description: "Detailed log of all payments received, filterable by date, customer, or payment method.",
  },
  {
    id: "meter-reading-accuracy",
    name: "Meter Reading Accuracy Report",
    description: "Analysis of meter reading consistency and potential discrepancies, highlighting meters needing inspection.",
  },
];

export default function AdminReportsPage() {
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const selectedReport = availableReports.find(report => report.id === selectedReportId);

  const handleGenerateReport = () => {
    if (!selectedReport) return;
    setIsGenerating(true);
    // Simulate report generation
    console.log(`Generating ${selectedReport.name}...`);
    setTimeout(() => {
      setIsGenerating(false);
      // Here you would typically trigger a download or display the report
      alert(`${selectedReport.name} generated (simulated).`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Generate Reports</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Select a report type and configure options to generate your desired report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-type">Select Report Type</Label>
            <Select value={selectedReportId} onValueChange={setSelectedReportId}>
              <SelectTrigger id="report-type" className="w-full md:w-[400px]">
                <SelectValue placeholder="Choose a report..." />
              </SelectTrigger>
              <SelectContent>
                {availableReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      {report.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReport && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-xl">{selectedReport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                {/* Add date pickers or other filters here as needed */}
                <div className="mt-4 space-y-2">
                  <Label>Report Filters (Coming Soon)</Label>
                  <div className="p-4 border rounded-md text-sm text-muted-foreground">
                    Date range selectors, branch filters, etc., will appear here based on the selected report type.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedReport && (
            <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedReportId}>
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : `Generate ${selectedReport.name}`}
            </Button>
          )}

          {!selectedReportId && (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Please select a report type to see details and generate.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
