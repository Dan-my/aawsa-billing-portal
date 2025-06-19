
"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, Ticket, Percent, CircleDollarSign, CalendarOff, CalendarCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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
import type { Voucher, VoucherStatus, VoucherDiscountType } from "./voucher-types";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface VoucherTableProps {
  data: Voucher[];
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
}

export function VoucherTable({ data, onEdit, onDelete }: VoucherTableProps) {
  const getStatusBadgeVariant = (status: VoucherStatus) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Used': return 'secondary';
      case 'Expired': return 'outline';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: VoucherStatus) => {
    switch (status) {
      case 'Active': return <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500" />;
      case 'Used': return <XCircle className="mr-1.5 h-3.5 w-3.5 text-gray-500" />;
      case 'Expired': return <CalendarOff className="mr-1.5 h-3.5 w-3.5 text-orange-500" />;
      case 'Cancelled': return <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  if (data.length === 0) {
    return (
      <div className="mt-4 p-6 border rounded-md bg-muted/50 text-center text-muted-foreground">
        <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="font-semibold">No vouchers found.</p>
        <p className="text-sm">Click "Add New Voucher" to get started.</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((voucher) => (
            <TableRow key={voucher.id}>
              <TableCell className="font-medium">{voucher.code}</TableCell>
              <TableCell>
                {voucher.discountType === 'percentage' ? (
                  <><Percent className="inline-block mr-1 h-4 w-4 text-blue-500" /> {voucher.discountValue}%</>
                ) : (
                  <><CircleDollarSign className="inline-block mr-1 h-4 w-4 text-green-500" /> ETB {voucher.discountValue.toFixed(2)}</>
                )}
              </TableCell>
              <TableCell>
                {voucher.expiryDate ? (
                  <span className={cn(new Date(voucher.expiryDate) < new Date() && voucher.status !== 'Expired' && "text-orange-600 font-semibold")}>
                    {format(parseISO(voucher.expiryDate), "PP")}
                  </span>
                 ) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(voucher.status)} className="capitalize">
                  {getStatusIcon(voucher.status)}
                  {voucher.status}
                </Badge>
              </TableCell>
              <TableCell>
                {voucher.timesUsed ?? 0} / {voucher.maxUses ?? '∞'}
              </TableCell>
              <TableCell className="truncate max-w-xs">{voucher.notes || "-"}</TableCell>
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
                    <DropdownMenuItem onClick={() => onEdit(voucher)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(voucher)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
