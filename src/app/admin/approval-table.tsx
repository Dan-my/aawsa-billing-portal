
"use client";

import * as React from "react";
import { Check, Frown, Hourglass, FileEdit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IndividualCustomer } from "../individual-customers/individual-customer-types";
import { cn } from "@/lib/utils";
import type { Branch } from "../branches/branch-types";

interface ApprovalTableProps {
  data: IndividualCustomer[];
  onApprove: (customer: IndividualCustomer) => void;
  onReject: (customer: IndividualCustomer) => void;
  branches: Branch[];
}

export function ApprovalTable({ data, onApprove, onReject, branches }: ApprovalTableProps) {
  
  const getCustomerBranchName = (branchId?: string, fallbackLocation?: string) => {
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      if (branch) return branch.name;
    }
    return fallbackLocation || "N/A";
  };

  if (data.length === 0) {
    return null;
  }
  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Meter No.</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Cust. Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer) => (
            <TableRow key={customer.customerKeyNumber}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.meterNumber}</TableCell>
              <TableCell>{getCustomerBranchName(customer.branchId, customer.subCity)}</TableCell>
              <TableCell>{customer.customerType}</TableCell>
              <TableCell>
                <Badge
                   variant={'secondary'}
                   className={cn("bg-amber-500 text-white hover:bg-amber-600")}
                >
                  <Hourglass className="mr-1 h-3.5 w-3.5"/>
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="destructive" size="sm" onClick={() => onReject(customer)}>
                    <FileEdit className="mr-2 h-4 w-4"/> Amend
                </Button>
                <Button variant="default" size="sm" onClick={() => onApprove(customer)}>
                    <Check className="mr-2 h-4 w-4"/> Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
