
"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, User } from "lucide-react";
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

interface IndividualCustomerTableProps {
  data: IndividualCustomer[];
  onEdit: (customer: IndividualCustomer) => void;
  onDelete: (customer: IndividualCustomer) => void;
  bulkMetersList?: { id: string; name: string }[];
}

export function IndividualCustomerTable({ data, onEdit, onDelete, bulkMetersList = [] }: IndividualCustomerTableProps) {
  
  const getBulkMeterName = (id?: string) => {
    if (!id) return "-";
    return bulkMetersList.find(bm => bm.id === id)?.name || "Unknown BM";
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
            <TableHead>Ordinal</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Ward</TableHead>
            <TableHead>Bulk Meter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer, index) => (
            <TableRow key={`${customer.id}-${index}`}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.ordinal}</TableCell>
              <TableCell>{customer.month}</TableCell>
              <TableCell>{customer.location}</TableCell>
              <TableCell>{customer.ward}</TableCell>
              <TableCell>{getBulkMeterName(customer.assignedBulkMeterId)}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
