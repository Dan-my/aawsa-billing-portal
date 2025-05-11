
"use client";

import * as React from "react";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCustomers, getBulkMeters, initializeCustomers, initializeBulkMeters } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { initialCustomers } from "@/app/admin/individual-customers/page";
import { initialBulkMeters } from "@/app/admin/bulk-meters/page";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";

interface User {
  email: string;
  role: "admin" | "staff";
  branchName?: string;
}

interface ReportType {
  id: string;
  name: string;
  description: string;
  headers?: string[];
  getData?: (branchName?: string) => any[]; // Accept optional branchName
}

const arrayToXlsxBlob = (data: any[], headers: string[]): Blob => {
  const worksheetData = [
    headers,
    ...data.map(row => headers.map(header => row[header] ?? '')),
  ];

  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[address]) {
        XLSX.utils.sheet_add_aoa(ws, [[headers[C] || '']], { origin: address });
    }
    ws[address].s = { font: { bold: true } };
  }
  const colWidths = headers.map((header, colIndex) => {
    let maxLength = (header || '').length;
    for (const dataRow of worksheetData.slice(1)) {
      const cellValue = dataRow[colIndex];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, String(cellValue).length);
      }
    }
    return { wch: Math.min(maxLength + 2, 60) };
  });
  ws['!cols'] = colWidths;

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const downloadFile = (content: Blob, fileName: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Define reports available to staff
// Staff reports might be filtered by their branch or have fewer options
const availableStaffReports: ReportType[] = [
  {
    id: "customer-data-branch-export",
    name: "My Branch Customer Data (XLSX)",
    description: "Download a list of individual customers assigned to your branch.",
    headers: [
      "id", "name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal",
      "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea",
      "location", "ward", "sewerageConnection", "assignedBulkMeterId", "status", "paymentStatus", "calculatedBill"
    ],
    getData: (branchName?: string) => {
      const allCustomers = getCustomers();
      if (!branchName) return allCustomers; // Or return empty array if branch context is strict
      // This filtering logic assumes bulk meters are associated with a branch indirectly
      // Or customers have a direct branch field. For simplicity, we'll filter by bulk meter location (as a proxy for branch)
      // This needs to be adapted based on how branches are actually linked to customers/bulk meters
      const branchBulkMeters = getBulkMeters().filter(bm => bm.location.includes(branchName) || bm.name.includes(branchName)); // Example filter
      const branchBulkMeterIds = branchBulkMeters.map(bm => bm.id);
      return allCustomers.filter(c => c.assignedBulkMeterId && branchBulkMeterIds.includes(c.assignedBulkMeterId));
    },
  },
  {
    id: "bulk-meter-data-branch-export",
    name: "My Branch Bulk Meter Data (XLSX)",
    description: "Download a list of bulk meters relevant to your branch.",
    headers: [
      "id", "name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber",
      "previousReading", "currentReading", "month", "specificArea", "location", "ward", "status", "paymentStatus"
    ],
    getData: (branchName?: string) => {
       const allBulkMeters = getBulkMeters();
       if (!branchName) return allBulkMeters;
       return allBulkMeters.filter(bm => bm.location.includes(branchName) || bm.name.includes(branchName)); // Example filter
    },
  },
  {
    id: "billing-summary-branch",
    name: "My Branch Billing Summary (Coming Soon)",
    description: "Summary of paid and unpaid bills for your branch.",
  },
];

export default function StaffReportsPage() {
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [staffBranchName, setStaffBranchName] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (getCustomers().length === 0) initializeCustomers(initialCustomers);
    if (getBulkMeters().length === 0) initializeBulkMeters(initialBulkMeters);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role === "staff" && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const selectedReport = availableStaffReports.find(report => report.id === selectedReportId);

  const handleGenerateReport = () => {
    if (!selectedReport) return;

    if (!selectedReport.getData || !selectedReport.headers) {
      toast({
        variant: "destructive",
        title: "Report Not Implemented",
        description: `${selectedReport.name} is not available for download yet.`,
      });
      return;
    }
    if (!staffBranchName && (selectedReport.id.includes("branch"))) {
        toast({
            variant: "destructive",
            title: "Branch Information Missing",
            description: "Cannot generate branch-specific report without branch information.",
        });
        return;
    }


    setIsGenerating(true);
    console.log(`Generating ${selectedReport.name} for branch: ${staffBranchName || 'All (if applicable)'}...`);

    try {
      const data = selectedReport.getData(staffBranchName);
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: `No data available to generate ${selectedReport.name}.`,
        });
        setIsGenerating(false);
        return;
      }

      const xlsxBlob = arrayToXlsxBlob(data, selectedReport.headers);
      const fileName = `${selectedReport.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(xlsxBlob, fileName);
      
      toast({
        title: "Report Generated",
        description: `${selectedReport.name} has been downloaded as ${fileName}.`,
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Report",
        description: "An unexpected error occurred while generating the report.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Generate Reports {staffBranchName ? `(${staffBranchName})` : ''}</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Select a report type to generate and download for your branch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-type">Select Report Type</Label>
            <Select value={selectedReportId} onValueChange={setSelectedReportId}>
              <SelectTrigger id="report-type" className="w-full md:w-[400px]">
                <SelectValue placeholder="Choose a report..." />
              </SelectTrigger>
              <SelectContent>
                {availableStaffReports.map((report) => (
                  <SelectItem key={report.id} value={report.id} disabled={!report.getData}>
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
                {!selectedReport.getData && (
                   <Alert variant="default" className="mt-4 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30">
                     <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                     <AlertTitle className="text-blue-700 dark:text-blue-300">Coming Soon</AlertTitle>
                     <UIAlertDescription className="text-blue-600 dark:text-blue-400">
                         This report is currently under development.
                     </UIAlertDescription>
                   </Alert>
                )}
                 {selectedReport.getData && (
                  <div className="mt-4 space-y-2">
                    <Label>Report Filters (Default: Your Branch)</Label>
                    <div className="p-4 border rounded-md text-sm text-muted-foreground">
                      This report will be filtered for your branch ({staffBranchName || 'N/A'}).
                    </div>
                  </div>
                 )}
              </CardContent>
            </Card>
          )}

          {selectedReport && selectedReport.getData && (
            <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedReportId || (!staffBranchName && selectedReport.id.includes("branch"))}>
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : `Generate & Download ${selectedReport.name.replace(" (XLSX)", "").replace(" (Coming Soon)", "")}`}
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
