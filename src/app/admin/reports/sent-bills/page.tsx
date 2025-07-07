
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/table-pagination";
import { BillTable } from "../bill-table";
import { 
  getBills, initializeBills, subscribeToBills,
  getCustomers, initializeCustomers, subscribeToCustomers,
  getBulkMeters, initializeBulkMeters, subscribeToBulkMeters 
} from "@/lib/data-store";
import type { DomainBill } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { Send, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";


export default function SentBillsReportPage() {
  const { hasPermission } = usePermissions();
  const [bills, setBills] = React.useState<DomainBill[]>([]);
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [bulkMeters, setBulkMeters] = React.useState<BulkMeter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  
  React.useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([
            initializeBills(),
            initializeCustomers(),
            initializeBulkMeters(),
        ]);
        setBills(getBills());
        setCustomers(getCustomers());
        setBulkMeters(getBulkMeters());
        setIsLoading(false);
    };
    fetchData();

    const unsubBills = subscribeToBills(setBills);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubBms = subscribeToBulkMeters(setBulkMeters);

    return () => {
        unsubBills();
        unsubCustomers();
        unsubBms();
    };
  }, []);

  const filteredBills = React.useMemo(() => {
    let searchableBills = [...bills];

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      searchableBills = searchableBills.filter(bill => {
        const customerKey = bill.individualCustomerId || bill.bulkMeterId;
        return customerKey?.toLowerCase().includes(lowercasedTerm);
      });
    }

    return searchableBills.sort((a, b) => new Date(b.billPeriodEndDate).getTime() - new Date(a.billPeriodEndDate).getTime());
  }, [bills, searchTerm]);
  
  const paginatedBills = filteredBills.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  if (!hasPermission('reports_view_sent_bills')) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>List of All Sent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <UIAlertDescription>You do not have permission to view this page.</UIAlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Send className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>List of All Sent Bills</CardTitle>
                    <CardDescription>A comprehensive, real-time list of all generated bills in the system.</CardDescription>
                </div>
              </div>
              <div className="relative w-full md:w-auto md:min-w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by Customer Key..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-8 text-muted-foreground">Loading all bills...</div>
          ) : (
            <BillTable bills={paginatedBills} customers={customers} bulkMeters={bulkMeters} />
          )}
        </CardContent>
         {filteredBills.length > 0 && (
          <TablePagination
            count={filteredBills.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
          />
        )}
      </Card>
    </div>
  );
}
