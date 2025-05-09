
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
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import { initialCustomers } from "../individual-customers/page";
import { initialBulkMeters } from "../bulk-meters/page";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert"; // Renamed to avoid conflict

interface ReportType {
  id: string;
  name: string;
  description: string;
  headers?: string[]; // For XLSX export
  getData?: () => any[]; // Function to fetch data for the report
}

const arrayToXlsxBlob = (data: any[], headers: string[]): Blob => {
  const worksheetData = [
    headers, // First row is headers
    ...data.map(row => headers.map(header => row[header] ?? '')),
  ];

  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Apply bold styling to header cells (first row)
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[address]) { // If cell doesn't exist (e.g. empty header), create it
        XLSX.utils.sheet_add_aoa(ws, [[headers[C] || '']], { origin: address });
    }
    ws[address].s = { font: { bold: true } };
  }

  // Calculate column widths based on header and data content
  const colWidths = headers.map((header, colIndex) => {
    let maxLength = (header || '').length;
    for (const dataRow of worksheetData.slice(1)) { // Skip header row
      const cellValue = dataRow[colIndex];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, String(cellValue).length);
      }
    }
    return { wch: Math.min(maxLength + 2, 60) }; // Add padding, max width 60
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


const availableReports: ReportType[] = [
  {
    id: "customer-data-export",
    name: "Customer Data Export (XLSX)",
    description: "Download a comprehensive list of all individual customers, including their details and meter information.",
    headers: [
      "id", "name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal",
      "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea",
      "location", "ward", "sewerageConnection", "assignedBulkMeterId", "status", "paymentStatus", "calculatedBill"
    ],
    getData: () => getCustomers(),
  },
  {
    id: "bulk-meter-data-export",
    name: "Bulk Meter Data Export (XLSX)",
    description: "Download a comprehensive list of all bulk meters, including their details and readings.",
    headers: [
      "id", "name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber",
      "previousReading", "currentReading", "month", "specificArea", "location", "ward", "status", "paymentStatus"
    ],
    getData: () => getBulkMeters(),
  },
  {
    id: "billing-summary",
    name: "Billing Summary Report (Coming Soon)",
    description: "Summary of paid and unpaid bills for a selected period. Includes totals, payment rates, and overdue amounts.",
  },
  {
    id: "water-usage",
    name: "Water Usage Report (Coming Soon)",
    description: "Detailed water consumption report by customer type, branch, or geographical area. Helps identify trends and anomalies.",
  },
  {
    id: "payment-history",
    name: "Payment History Report (Coming Soon)",
    description: "Detailed log of all payments received, filterable by date, customer, or payment method.",
  },
  {
    id: "meter-reading-accuracy",
    name: "Meter Reading Accuracy Report (Coming Soon)",
    description: "Analysis of meter reading consistency and potential discrepancies, highlighting meters needing inspection.",
  },
];

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    // Ensure data stores are initialized
    if (getCustomers().length === 0) {
      initializeCustomers(initialCustomers);
    }
    if (getBulkMeters().length === 0) {
      initializeBulkMeters(initialBulkMeters);
    }
  }, []);

  const selectedReport = availableReports.find(report => report.id === selectedReportId);

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

    setIsGenerating(true);
    console.log(`Generating ${selectedReport.name}...`);

    try {
      const data = selectedReport.getData();
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
        <h1 className="text-3xl font-bold">Generate Reports</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Select a report type to generate and download.</CardDescription>
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
                         This report is currently under development and will be available in a future update.
                     </UIAlertDescription>
                   </Alert>
                )}
                 {selectedReport.getData && (
                  <div className="mt-4 space-y-2">
                    <Label>Report Filters (Coming Soon)</Label>
                    <div className="p-4 border rounded-md text-sm text-muted-foreground">
                      Date range selectors, branch filters, etc., will appear here based on the selected report type. For now, the export contains all available data.
                    </div>
                  </div>
                 )}
              </CardContent>
            </Card>
          )}

          {selectedReport && selectedReport.getData && (
            <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedReportId}>
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

