
"use client";

import * as React from "react";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Info, AlertCircle, Lock, Archive, Trash2 } from "lucide-react";
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
  initializeIndividualCustomerReadings,
  initializeBulkMeterReadings,
  getPayments,
  initializePayments,
  getStaffMembers, 
  initializeStaffMembers,
  getBranches,
  initializeBranches,
  removeBill,
} from "@/lib/data-store";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import type { StaffMember } from "../staff-management/staff-types";
import type { Branch } from "../branches/branch-types";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { usePermissions } from "@/hooks/use-permissions";
import { DatePicker } from "@/components/ui/date-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { DomainBill } from "@/lib/data-store";


interface ReportFilters {
  branchId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ReportType {
  id: string;
  name: string;
  description: string;
  headers?: string[];
  getData?: (filters: ReportFilters) => any[];
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
      "customerKeyNumber", "name", "contractNumber", "customerType", "bookNumber", "ordinal",
      "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea",
      "location", "ward", "sewerageConnection", "assignedBulkMeterId", "status", "paymentStatus", "calculatedBill",
      "Assigned Branch Name", "created_at", "updated_at"
    ],
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      const customers = getCustomers();
      const branches = getBranches();
      
      let filteredData = customers;

      if (branchId) {
        filteredData = filteredData.filter(c => c.branchId === branchId);
      }
      if (startDate && endDate) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        filteredData = filteredData.filter(c => {
          if (!c.created_at) return false;
          try {
            const customerDate = new Date(c.created_at).getTime();
            return customerDate >= start && customerDate <= end;
          } catch { return false; }
        });
      }

      return filteredData.map(customer => {
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
      "customerKeyNumber", "name", "contractNumber", "meterSize", "meterNumber",
      "previousReading", "currentReading", "month", "specificArea", "location", "ward", "status", 
      "paymentStatus", "chargeGroup", "sewerageConnection", "Assigned Branch Name", 
      "bulkUsage", "totalBulkBill", "differenceUsage", "differenceBill"
    ],
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      const bulkMeters = getBulkMeters();
      const branches = getBranches();

      let filteredData = bulkMeters;

      if (branchId) {
        filteredData = filteredData.filter(bm => bm.branchId === branchId);
      }
      // Note: Bulk meter table does not have a created_at field, this filter will be ignored for this report for now.

      return filteredData.map(bm => {
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
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      let bills = getBills();
      
      if (branchId) {
        const bulkMetersInBranch = getBulkMeters().filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber);
        const customersInBranch = getCustomers().filter(c => c.branchId === branchId).map(c => c.customerKeyNumber);
        bills = bills.filter(b => 
          (b.bulkMeterId && bulkMetersInBranch.includes(b.bulkMeterId)) ||
          (b.individualCustomerId && customersInBranch.includes(b.individualCustomerId))
        );
      }
      if (startDate && endDate) {
         const start = startDate.getTime();
         const end = endDate.getTime();
         bills = bills.filter(b => {
           try {
             const billDate = new Date(b.billPeriodEndDate).getTime();
             return billDate >= start && billDate <= end;
           } catch { return false; }
         });
      }
      return bills;
    },
  },
  {
    id: "list-of-paid-bills",
    name: "List Of Paid Bills (XLSX)",
    description: "A filtered list showing only the bills that have been marked as 'Paid'.",
    headers: [
        "id", "individualCustomerId", "bulkMeterId", "billPeriodStartDate", "billPeriodEndDate", 
        "monthYear", "previousReadingValue", "currentReadingValue", "usageM3", 
        "baseWaterCharge", "sewerageCharge", "maintenanceFee", "sanitationFee", 
        "meterRent", "totalAmountDue", "amountPaid", "balanceDue", "dueDate", 
        "paymentStatus", "billNumber", "notes", "createdAt", "updatedAt"
    ],
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      let bills = getBills();
      
      if (branchId) {
        const bulkMetersInBranch = getBulkMeters().filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber);
        const customersInBranch = getCustomers().filter(c => c.branchId === branchId).map(c => c.customerKeyNumber);
        bills = bills.filter(b => 
          (b.bulkMeterId && bulkMetersInBranch.includes(b.bulkMeterId)) ||
          (b.individualCustomerId && customersInBranch.includes(b.individualCustomerId))
        );
      }
      if (startDate && endDate) {
         const start = startDate.getTime();
         const end = endDate.getTime();
         bills = bills.filter(b => {
           try {
             const billDate = new Date(b.billPeriodEndDate).getTime();
             return billDate >= start && billDate <= end;
           } catch { return false; }
         });
      }
      return bills.filter(b => b.paymentStatus === 'Paid');
    },
  },
  {
    id: "list-of-sent-bills",
    name: "List Of Sent Bills (XLSX)",
    description: "A comprehensive list of all bills that have been generated, regardless of payment status.",
    headers: [
        "id", "individualCustomerId", "bulkMeterId", "billPeriodStartDate", "billPeriodEndDate", 
        "monthYear", "previousReadingValue", "currentReadingValue", "usageM3", 
        "baseWaterCharge", "sewerageCharge", "maintenanceFee", "sanitationFee", 
        "meterRent", "totalAmountDue", "amountPaid", "balanceDue", "dueDate", 
        "paymentStatus", "billNumber", "notes", "createdAt", "updatedAt"
    ],
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      let bills = getBills();
      
      if (branchId) {
        const bulkMetersInBranch = getBulkMeters().filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber);
        const customersInBranch = getCustomers().filter(c => c.branchId === branchId).map(c => c.customerKeyNumber);
        bills = bills.filter(b => 
          (b.bulkMeterId && bulkMetersInBranch.includes(b.bulkMeterId)) ||
          (b.individualCustomerId && customersInBranch.includes(b.individualCustomerId))
        );
      }
      if (startDate && endDate) {
         const start = startDate.getTime();
         const end = endDate.getTime();
         bills = bills.filter(b => {
           try {
             const billDate = new Date(b.billPeriodEndDate).getTime();
             return billDate >= start && billDate <= end;
           } catch { return false; }
         });
      }
      return bills;
    },
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
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      let readings = getMeterReadings();

      if (branchId) {
        const bulkMetersInBranch = getBulkMeters().filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber);
        const customersInBranch = getCustomers().filter(c => c.branchId === branchId).map(c => c.customerKeyNumber);
        readings = readings.filter(r => 
          (r.meterType === 'bulk_meter' && r.bulkMeterId && bulkMetersInBranch.includes(r.bulkMeterId)) ||
          (r.meterType === 'individual_customer_meter' && r.individualCustomerId && customersInBranch.includes(r.individualCustomerId))
        );
      }
      if (startDate && endDate) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        readings = readings.filter(r => {
          try {
            const readingDate = new Date(r.readingDate).getTime();
            return readingDate >= start && readingDate <= end;
          } catch { return false; }
        });
      }
      return readings;
    },
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
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      let payments = getPayments();

      if (branchId) {
        const customersInBranch = getCustomers().filter(c => c.branchId === branchId).map(c => c.customerKeyNumber);
        payments = payments.filter(p => p.individualCustomerId && customersInBranch.includes(p.individualCustomerId));
      }
      if (startDate && endDate) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        payments = payments.filter(p => {
          try {
            const paymentDate = new Date(p.paymentDate).getTime();
            return paymentDate >= start && paymentDate <= end;
          } catch { return false; }
        });
      }
      return payments;
    },
  },
  {
    id: "meter-reading-accuracy",
    name: "Meter Reading Accuracy Report (XLSX)",
    description: "Detailed export of meter readings with reader information for accuracy analysis.",
    headers: [
      "Reading ID", "Meter Identifier", "Meter Type", "Reading Date", "Month/Year", 
      "Reading Value", "Is Estimate", "Reader Name", "Reader Staff ID", "Notes"
    ],
    getData: (filters) => {
      const { branchId, startDate, endDate } = filters;
      const readings = getMeterReadings();
      const customers = getCustomers();
      const bulkMeters = getBulkMeters();
      const staffList = getStaffMembers();

      let filteredReadings = readings;

      if (branchId) {
        const bulkMetersInBranch = bulkMeters.filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber);
        const customersInBranch = customers.filter(c => c.branchId === branchId).map(c => c.customerKeyNumber);
        filteredReadings = filteredReadings.filter(r => 
          (r.meterType === 'bulk_meter' && r.bulkMeterId && bulkMetersInBranch.includes(r.bulkMeterId)) ||
          (r.meterType === 'individual_customer_meter' && r.individualCustomerId && customersInBranch.includes(r.individualCustomerId))
        );
      }
      if (startDate && endDate) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        filteredReadings = filteredReadings.filter(r => {
          try {
            const readingDate = new Date(r.readingDate).getTime();
            return readingDate >= start && readingDate <= end;
          } catch { return false; }
        });
      }

      return filteredReadings.map(r => {
        let meterIdentifier = "N/A";
        if (r.meterType === 'individual_customer_meter' && r.individualCustomerId) {
          const cust = customers.find(c => c.customerKeyNumber === r.individualCustomerId);
          meterIdentifier = cust ? `${cust.name} (M: ${cust.meterNumber || 'N/A'})` : `Cust ID: ${r.individualCustomerId}`;
        } else if (r.meterType === 'bulk_meter' && r.bulkMeterId) {
          const bm = bulkMeters.find(b => b.customerKeyNumber === r.bulkMeterId);
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
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState<StaffMember | null>(null);

  const [archiveCutoffDate, setArchiveCutoffDate] = React.useState<Date | undefined>();
  const [archivableBills, setArchivableBills] = React.useState<DomainBill[]>([]);
  const [isArchiveDeleteConfirmationOpen, setIsArchiveDeleteConfirmationOpen] = React.useState(false);

  const canSelectAllBranches = hasPermission('reports_generate_all');
  const isLockedToBranch = !canSelectAllBranches && hasPermission('reports_generate_branch');

  React.useEffect(() => {
    const initializeData = async () => {
        setIsLoading(true);
        await initializeCustomers();
        await initializeBulkMeters();
        await initializeBills();
        await initializeIndividualCustomerReadings();
        await initializeBulkMeterReadings();
        await initializePayments();
        await initializeStaffMembers();
        await initializeBranches();
        setBranches(getBranches());

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as StaffMember;
          setUser(parsedUser);
          if (!hasPermission('reports_generate_all') && hasPermission('reports_generate_branch') && parsedUser.branchId) {
              setSelectedBranch(parsedUser.branchId);
          }
        }
        setIsLoading(false);
    };
    initializeData();
  }, [hasPermission]);

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
      const data = selectedReport.getData({
          branchId: selectedBranch === 'all' ? undefined : selectedBranch,
          startDate: dateRange?.from,
          endDate: dateRange?.to
      });
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: `No data found for ${selectedReport.name} with the selected filters.`,
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
  
  const handleGenerateArchiveFile = () => {
    if (!archiveCutoffDate) {
      toast({ variant: "destructive", title: "Date Required", description: "Please select a cutoff date for the archive." });
      return;
    }

    const billsToArchive = getBills().filter(b => new Date(b.billPeriodEndDate) < archiveCutoffDate);

    if (billsToArchive.length === 0) {
      toast({ title: "No Data", description: `No bills found before the selected date to archive.` });
      setArchivableBills([]);
      return;
    }

    setArchivableBills(billsToArchive);
    
    const archiveHeaders = Object.keys(billsToArchive[0]);
    const xlsxBlob = arrayToXlsxBlob(billsToArchive, archiveHeaders);
    const fileName = `archive_bills_before_${archiveCutoffDate.toISOString().split('T')[0]}.xlsx`;
    downloadFile(xlsxBlob, fileName);

    toast({ title: "Archive File Generated", description: `${billsToArchive.length} bill records have been exported.` });
  };
  
  const handleConfirmArchiveDeletion = async () => {
    if (archivableBills.length === 0) return;

    setIsGenerating(true);
    const billIdsToDelete = archivableBills.map(b => b.id);
    let successCount = 0;
    
    for (const billId of billIdsToDelete) {
      const result = await removeBill(billId);
      if (result.success) {
        successCount++;
      } else {
        toast({ variant: "destructive", title: "Deletion Error", description: `Could not delete bill ID ${billId}. Aborting.` });
        break;
      }
    }

    toast({ title: "Archive Complete", description: `Successfully deleted ${successCount} out of ${billIdsToDelete.length} archived records from the database.` });
    
    setIsGenerating(false);
    setArchivableBills([]);
    setArchiveCutoffDate(undefined);
    setIsArchiveDeleteConfirmationOpen(false);
  };


  if (!hasPermission('reports_generate_all') && !hasPermission('reports_generate_branch')) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Generate Reports</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <UIAlertDescription>You do not have permission to generate reports.</UIAlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Generate Reports</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Select a report type and apply filters to generate and download.</CardDescription>
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
                <CardTitle>{selectedReport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                 {selectedReport.getData ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="branch-filter">Filter by Branch</Label>
                        <Select 
                            value={selectedBranch} 
                            onValueChange={setSelectedBranch} 
                            disabled={isLoading || !canSelectAllBranches}
                        >
                            <SelectTrigger id="branch-filter" className={!canSelectAllBranches ? 'cursor-not-allowed' : ''}>
                                {isLockedToBranch && <Lock className="mr-2 h-4 w-4" />}
                                <SelectValue placeholder="Select a branch"/>
                            </SelectTrigger>
                            <SelectContent>
                                {canSelectAllBranches && <SelectItem value="all">All Branches</SelectItem>}
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-range-filter">Filter by Date</Label>
                        <DateRangePicker 
                            date={dateRange} 
                            onDateChange={setDateRange}
                        />
                    </div>
                  </div>
                 ) : (
                   <Alert variant="default" className="mt-4 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30">
                     <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                     <AlertTitle className="text-blue-700 dark:text-blue-300">Coming Soon</AlertTitle>
                     <UIAlertDescription className="text-blue-600 dark:text-blue-400">
                         This report is currently under development and will be available in a future update.
                     </UIAlertDescription>
                   </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {selectedReport && selectedReport.getData && (
            <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedReportId}>
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : `Generate & Download ${selectedReport.name.replace(" (XLSX)", "")}`}
            </Button>
          )}

          {!selectedReportId && (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Please select a report type to see details and generate.
             </div>
          )}
        </CardContent>
      </Card>
      
      {/* Data Archiving Section */}
      <Card className="shadow-lg border-amber-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Archive className="h-6 w-6 text-amber-600"/> Data Archiving</CardTitle>
          <CardDescription>Free up database storage by archiving old records. This is a two-step process: first export the data, then confirm deletion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>1. Export Bill Records Before Date</Label>
             <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <DatePicker date={archiveCutoffDate} setDate={setArchiveCutoffDate} />
              <Button onClick={handleGenerateArchiveFile} disabled={isGenerating || !archiveCutoffDate}>
                <Download className="mr-2 h-4 w-4" /> Export Archive File
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
                This will generate and download an XLSX file of all bill records before the selected date.
            </p>
          </div>
          
          {archivableBills.length > 0 && (
            <div className="space-y-2 p-4 border-l-4 border-destructive rounded-r-md bg-destructive/10">
              <Label className="text-destructive">2. Confirm Deletion of Archived Records</Label>
               <p className="text-sm text-destructive/80">
                  You have exported {archivableBills.length} records. Please ensure you have securely saved the downloaded file. This action is irreversible.
               </p>
               <Button variant="destructive" onClick={() => setIsArchiveDeleteConfirmationOpen(true)} disabled={isGenerating}>
                  <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete {archivableBills.length} Records
               </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isArchiveDeleteConfirmationOpen} onOpenChange={setIsArchiveDeleteConfirmationOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. You are about to permanently delete {archivableBills.length} bill records from the database. Have you downloaded and verified the archive file?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmArchiveDeletion} className="bg-destructive hover:bg-destructive/90">Yes, Delete Records</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
