
"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, User, CheckCircle, XCircle, Clock, Building } from "lucide-react"; // Added Building
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { IndividualCustomer } from "./individual-customer-types";
import { cn } from "@/lib/utils";
import type { Branch } from "../branches/branch-types"; // Added

interface IndividualCustomerTableProps {
  data: IndividualCustomer[];
  onEdit: (customer: IndividualCustomer) => void;
  onDelete: (customer: IndividualCustomer) => void;
  bulkMetersList?: { id: string; name: string }[];
  branches: Branch[]; // Added
  currency?: string;
}

export function IndividualCustomerTable({ data, onEdit, onDelete, bulkMetersList = [], branches, currency = "ETB" }: IndividualCustomerTableProps) { // Added branches

  const getBulkMeterName = (id?: string) => {
    if (!id) return "-";
    return bulkMetersList.find(bm => bm.id === id)?.name || "Unknown BM";
  };

  const getCustomerBranchName = (branchId?: string, fallbackLocation?: string) => { // Added
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      if (branch) return branch.name;
    }
    return fallbackLocation || "-";
  };

  if (data.length === 0) {
    return (
      <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
        No customers match your search criteria. <User className="inline-block ml-2 h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Meter No.</TableHead>
            <TableHead>Cust. Branch/Location</TableHead> {/* Added/Renamed */}
            <TableHead>Cust. Type</TableHead>
            <TableHead>Usage (m³)</TableHead>
            <TableHead>Bill ({currency})</TableHead>
            <TableHead>Pay Status</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bulk Meter</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer) => {
            const usage = customer.currentReading - customer.previousReading;
            return (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.meterNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
                    {getCustomerBranchName(customer.branchId, customer.location)}
                  </div>
                </TableCell> {/* Added */}
                <TableCell>{customer.customerType}</TableCell>
                <TableCell>{usage.toFixed(2)}</TableCell>
                <TableCell>{customer.calculatedBill.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      customer.paymentStatus === 'Paid' ? 'default'
                      : customer.paymentStatus === 'Unpaid' ? 'destructive'
                      : 'secondary'
                    }
                    className={cn(
                        customer.paymentStatus === 'Paid' && "bg-green-500 hover:bg-green-600",
                        customer.paymentStatus === 'Pending' && "bg-yellow-500 hover:bg-yellow-600"
                    )}
                  >
                    {customer.paymentStatus === 'Paid' ? <CheckCircle className="mr-1 h-3.5 w-3.5"/> : customer.paymentStatus === 'Unpaid' ? <XCircle className="mr-1 h-3.5 w-3.5"/> : <Clock className="mr-1 h-3.5 w-3.5"/>}
                    {customer.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                     variant={
                      customer.status === 'Active' ? 'default'
                      : customer.status === 'Inactive' ? 'secondary'
                      : 'destructive'
                    }
                  >
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell>{getBulkMeterName(customer.assignedBulkMeterId)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
