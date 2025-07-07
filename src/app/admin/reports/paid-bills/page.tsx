
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
import { CheckCircle2 } from "lucide-react";

export default function PaidBillsReportPage() {
  const [bills, setBills] = React.useState<DomainBill[]>([]);
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [bulkMeters, setBulkMeters] = React.useState<BulkMeter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
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

  const paidBills = React.useMemo(() => {
    return bills
      .filter(bill => bill.paymentStatus === 'Paid')
      .sort((a, b) => new Date(b.billPeriodEndDate).getTime() - new Date(a.billPeriodEndDate).getTime());
  }, [bills]);
  
  const paginatedBills = paidBills.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>List of Paid Bills</CardTitle>
              <CardDescription>A real-time list of all bills that have been marked as paid.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-8 text-muted-foreground">Loading paid bills...</div>
          ) : (
            <BillTable bills={paginatedBills} customers={customers} bulkMeters={bulkMeters} />
          )}
        </CardContent>
         {paidBills.length > 0 && (
          <TablePagination
            count={paidBills.length}
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
