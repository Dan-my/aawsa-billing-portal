
"use client";

import * as React from "react";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  getCustomers, 
  getBulkMeters, 
  initializeCustomers, 
  initializeBulkMeters,
  getBills,
  initializeBills,
  getMeterReadings,
  initializeMeterReadings,
  getPayments,
  initializePayments,
  getStaffMembers, 
  initializeStaffMembers,
  getBranches, // Added
  initializeBranches // Added
} from "@/lib/data-store";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import { initialCustomers } from "../individual-customers/page";
import { initialBulkMeters } from "../bulk-meters/page";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import type { StaffMember } from "../staff-management/staff-types";
import type { Branch } from "../branches/branch-types"; // Added

interface ReportType {
  id: string;
  name: string;
  description: string;
  headers?: string[];
  getData?: () => any[];
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


const availableReports: ReportType[] = [
  {
    id: "customer-data-export",
    name: "Customer Data Export (XLSX)",
    description: "Download a comprehensive list of all individual customers with their details.",
    headers: [
      "id", "name", "customerKeyNumber", "contractNumber", "customerType", "bookNumber", "ordinal",
      "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea",
      "location", "ward", "sewerageConnection", "assignedBulkMeterId", "status", "paymentStatus", "calculatedBill",
      "Assigned Branch Name", "created_at", "updated_at"
    ],
    getData: () => {
      const customers = getCustomers();
      const branches = getBranches();
      return customers.map(customer => {
        const branch = customer.branchId ? branches.find(b => b.id === customer.branchId) : null;
        return {
          ...customer,
          "Assigned Branch Name": branch ? branch.name : "N/A",
        };
      });
    },
  },
  {
    id: "bulk-meter-data-export",
    name: "Bulk Meter Data Export (XLSX)",
    description: "Download a comprehensive list of all bulk meters, including their details and readings.",
    headers: [
      "id", "name", "customerKeyNumber", "contractNumber", "meterSize", "meterNumber",
      "previousReading", "currentReading", "month", "specificArea", "location", "ward", "status", "paymentStatus",
      "Assigned Branch Name", "bulkUsage", "totalBulkBill", "differenceUsage", "differenceBill"
    ],
    getData: () => {
      const bulkMeters = getBulkMeters();
      const branches = getBranches();
      return bulkMeters.map(bm => {
        const branch = bm.branchId ? branches.find(b => b.id === bm.branchId) : null;
        return {
          ...bm,
          "Assigned Branch Name": branch ? branch.name : "N/A",
        };
      });
    },
  },
  {
    id: "billing-summary",
    name: "Billing Summary Report (XLSX)",
    description: "Summary of all generated bills, including amounts and payment statuses.",
    headers: [
        "id", "individualCustomerId", "bulkMeterId", "billPeriodStartDate", "billPeriodEndDate", 
        "monthYear", "previousReadingValue", "currentReadingValue", "usageM3", 
        "baseWaterCharge", "sewerageCharge", "maintenanceFee", "sanitationFee", 
        "meterRent", "totalAmountDue", "amountPaid", "balanceDue", "dueDate", 
        "paymentStatus", "billNumber", "notes", "createdAt", "updatedAt"
    ],
    getData: () => getBills(),
  },
  {
    id: "water-usage",
    name: "Water Usage Report (XLSX)",
    description: "Detailed water consumption report from all meter readings.",
    headers: [
        "id", "meterType", "individualCustomerId", "bulkMeterId", "readerStaffId", 
        "readingDate", "monthYear", "readingValue", "isEstimate", "notes", 
        "createdAt", "updatedAt"
    ],
    getData: () => getMeterReadings(),
  },
  {
    id: "payment-history",
    name: "Payment History Report (XLSX)",
    description: "Detailed log of all payments received.",
    headers: [
        "id", "billId", "individualCustomerId", "paymentDate", "amountPaid", 
        "paymentMethod", "transactionReference", "processedByStaffId", "notes", 
        "createdAt", "updatedAt"
    ],
    getData: () => getPayments(),
  },
  {
    id: "meter-reading-accuracy",
    name: "Meter Reading Accuracy Report (XLSX)",
    description: "Detailed export of meter readings with reader information for accuracy analysis.",
    headers: [
      "Reading ID", "Meter Identifier", "Meter Type", "Reading Date", "Month/Year", 
      "Reading Value", "Is Estimate", "Reader Name", "Reader Staff ID", "Notes"
    ],
    getData: () => {
      const readings = getMeterReadings();
      const customers = getCustomers();
      const bulkMeters = getBulkMeters();
      const staffList = getStaffMembers();

      return readings.map(r => {
        let meterIdentifier = "N/A";
        if (r.meterType === 'individual_customer_meter' && r.individualCustomerId) {
          const cust = customers.find(c => c.id === r.individualCustomerId);
          meterIdentifier = cust ? `${cust.name} (M: ${cust.meterNumber || 'N/A'})` : `Cust ID: ${r.individualCustomerId}`;
        } else if (r.meterType === 'bulk_meter' && r.bulkMeterId) {
          const bm = bulkMeters.find(b => b.id === r.bulkMeterId);
          meterIdentifier = bm ? `${bm.name} (M: ${bm.meterNumber || 'N/A'})` : `BM ID: ${r.bulkMeterId}`;
        }

        const reader = r.readerStaffId ? staffList.find(s => s.id === r.readerStaffId) : null;
        const readerName = reader ? reader.name : (r.readerStaffId ? `Staff ID: ${r.readerStaffId}` : "N/A");

        return {
          "Reading ID": r.id,
          "Meter Identifier": meterIdentifier,
          "Meter Type": r.meterType === 'individual_customer_meter' ? 'Individual' : 'Bulk',
          "Reading Date": r.readingDate, 
          "Month/Year": r.monthYear,
          "Reading Value": r.readingValue,
          "Is Estimate": r.isEstimate ? "Yes" : "No",
          "Reader Name": readerName,
          "Reader Staff ID": r.readerStaffId || "N/A",
          "Notes": r.notes || "",
        };
      });
    },
  },
];

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const initializeData = async () => {
        await initializeCustomers();
        await initializeBulkMeters();
        await initializeBills();
        await initializeMeterReadings();
        await initializePayments();
        await initializeStaffMembers();
        await initializeBranches(); // Ensure branches are loaded
    };
    initializeData();
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
                     <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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

