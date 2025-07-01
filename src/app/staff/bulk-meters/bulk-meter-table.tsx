
"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, Gauge, Eye } from "lucide-react";
import Link from "next/link";
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
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import type { Branch } from "@/app/admin/branches/branch-types";

interface BulkMeterTableProps {
  data: BulkMeter[];
  onEdit: (bulkMeter: BulkMeter) => void;
  onDelete: (bulkMeter: BulkMeter) => void;
  branches: Branch[];
}

export function BulkMeterTable({ data, onEdit, onDelete, branches }: BulkMeterTableProps) {
  if (data.length === 0) {
    return (
      <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
        No bulk meters match your search criteria. <Gauge className="inline-block ml-2 h-5 w-5" />
      </div>
    );
  }

  const getBranchName = (branchId?: string, fallbackLocation?: string) => {
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      if (branch) return branch.name;
    }
    return fallbackLocation || "-";
  };

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Meter Number</TableHead>
            <TableHead>Branch / Location</TableHead> 
            <TableHead>Ward</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bulkMeter) => (
            <TableRow key={bulkMeter.customerKeyNumber}>
              <TableCell className="font-medium">{bulkMeter.name}</TableCell>
              <TableCell>{bulkMeter.meterNumber}</TableCell>
              <TableCell>{getBranchName(bulkMeter.branchId, bulkMeter.location)}</TableCell> 
              <TableCell>{bulkMeter.ward}</TableCell>
              <TableCell>
                <Badge 
                  variant={
                    bulkMeter.status === 'Active' ? 'default' 
                    : bulkMeter.status === 'Decommissioned' ? 'destructive' 
                    : 'secondary'
                  }
                >
                  {bulkMeter.status}
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
                     <Link href={`/staff/bulk-meters/${bulkMeter.customerKeyNumber}`} passHref>
                       <DropdownMenuItem>
                         <Eye className="mr-2 h-4 w-4" />
                         View Details
                       </DropdownMenuItem>
                     </Link>
                    <DropdownMenuItem onClick={() => onEdit(bulkMeter)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(bulkMeter)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
