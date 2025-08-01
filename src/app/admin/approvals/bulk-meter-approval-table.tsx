
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
import type { BulkMeter } from "../bulk-meters/bulk-meter-types";
import { cn } from "@/lib/utils";
import type { Branch } from "../branches/branch-types";

interface BulkMeterApprovalTableProps {
  data: BulkMeter[];
  onApprove: (meter: BulkMeter) => void;
  onReject: (meter: BulkMeter) => void;
  branches: Branch[];
}

export function BulkMeterApprovalTable({ data, onApprove, onReject, branches }: BulkMeterApprovalTableProps) {
  
  const getBranchName = (branchId?: string, fallbackLocation?: string) => {
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
            <TableHead>Charge Group</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((meter) => (
            <TableRow key={meter.customerKeyNumber}>
              <TableCell className="font-medium">{meter.name}</TableCell>
              <TableCell>{meter.meterNumber}</TableCell>
              <TableCell>{getBranchName(meter.branchId, meter.location)}</TableCell>
              <TableCell>{meter.chargeGroup}</TableCell>
              <TableCell>
                <Badge
                   variant={'secondary'}
                   className={cn("bg-amber-500 text-white hover:bg-amber-600")}
                >
                  <Hourglass className="mr-1 h-3.5 w-3.5"/>
                  {meter.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="destructive" size="sm" onClick={() => onReject(meter)}>
                    <FileEdit className="mr-2 h-4 w-4"/> Amend
                </Button>
                <Button variant="default" size="sm" onClick={() => onApprove(meter)}>
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
