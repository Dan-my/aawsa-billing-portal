
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/table-pagination";
import { BillTable } from "../bill-table";
import { 
  getBills, initializeBills, subscribeToBills,
  getCustomers, initializeCustomers, subscribeToCustomers,
  getBulkMeters, initializeBulkMeters, subscribeToBulkMeters,
  getBranches, initializeBranches, subscribeToBranches 
} from "@/lib/data-store";
import type { DomainBill } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { StaffMember } from "@/app/admin/staff-management/staff-types";
import type { Branch } from "@/app/admin/branches/branch-types";

export default function PaidBillsReportPage() {
  const [currentUser, setCurrentUser] = React.useState<StaffMember | null>(null);

  const [bills, setBills] = React.useState<DomainBill[]>([]);
  const [customers, setCustomers] = React.useState<IndividualCustomer[]>([]);
  const [bulkMeters, setBulkMeters] = React.useState<BulkMeter[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  
  React.useEffect(() => {
    const user = localStorage.getItem("user");
    if(user) setCurrentUser(JSON.parse(user));

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([
            initializeBills(),
            initializeCustomers(),
            initializeBulkMeters(),
            initializeBranches(),
        ]);
        setBills(getBills());
        setCustomers(getCustomers());
        setBulkMeters(getBulkMeters());
        setBranches(getBranches());
        setIsLoading(false);
    };
    fetchData();

    const unsubBills = subscribeToBills(setBills);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubBms = subscribeToBulkMeters(setBulkMeters);
    const unsubBranches = subscribeToBranches(setBranches);

    return () => {
        unsubBills();
        unsubCustomers();
        unsubBms();
        unsubBranches();
    };
  }, []);

  const filteredBills = React.useMemo(() => {
    let visibleBills = bills.filter(bill => bill.paymentStatus === 'Paid');

    if (currentUser?.role.toLowerCase() === 'staff management' && currentUser.branchId) {
        const branchBulkMeterKeys = new Set(
            bulkMeters.filter(bm => bm.branchId === currentUser.branchId).map(bm => bm.customerKeyNumber)
        );
        const directBranchCustomerKeys = new Set(
            customers.filter(c => c.branchId === currentUser.branchId).map(c => c.customerKeyNumber)
        );
        const indirectBranchCustomerKeys = new Set(
            customers.filter(c => c.assignedBulkMeterId && branchBulkMeterKeys.has(c.assignedBulkMeterId)).map(c => c.customerKeyNumber)
        );

        visibleBills = visibleBills.filter(bill => {
            if (bill.individualCustomerId) {
                return directBranchCustomerKeys.has(bill.individualCustomerId) || indirectBranchCustomerKeys.has(bill.individualCustomerId);
            }
            if (bill.bulkMeterId) {
                return branchBulkMeterKeys.has(bill.bulkMeterId);
            }
            return false;
        });
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      visibleBills = visibleBills.filter(bill => {
        const customerKey = bill.individualCustomerId || bill.bulkMeterId;
        return customerKey?.toLowerCase().includes(lowercasedTerm);
      });
    }

    return visibleBills.sort((a, b) => new Date(b.billPeriodEndDate).getTime() - new Date(a.billPeriodEndDate).getTime());
  }, [bills, customers, bulkMeters, searchTerm, currentUser]);
  
  const paginatedBills = filteredBills.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>List of Paid Bills</CardTitle>
                <CardDescription>A real-time list of all bills that have been marked as paid.</CardDescription>
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
            <div className="text-center p-8 text-muted-foreground">Loading paid bills...</div>
          ) : (
            <BillTable bills={paginatedBills} customers={customers} bulkMeters={bulkMeters} branches={branches} />
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
