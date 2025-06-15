
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ListX } from "lucide-react";

export interface DisplayTariffRate {
  id: string;
  description: string;
  minConsumption: string; // string for display '0.00' or '5.01'
  maxConsumption: string; // string for display '5.00' or 'Above'
  rate: number;
  originalLimit: number | typeof Infinity; // Store original limit for editing
  originalRate: number;
}

interface TariffRateTableProps {
  rates: DisplayTariffRate[];
  onEdit: (rate: DisplayTariffRate) => void;
  onDelete: (rate: DisplayTariffRate) => void;
  currency?: string;
}

export function TariffRateTable({ rates, onEdit, onDelete, currency = "ETB" }: TariffRateTableProps) {
  if (rates.length === 0) {
    return (
      <div className="mt-4 p-6 border rounded-md bg-muted/50 text-center text-muted-foreground">
        <ListX className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="font-semibold">No tariff rates configured.</p>
        <p className="text-sm">Click "Add New Tariff Tier" to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Description</TableHead>
            <TableHead>Min Consumption (m³)</TableHead>
            <TableHead>Max Consumption (m³)</TableHead>
            <TableHead>Rate ({currency}/m³)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((rate) => (
            <TableRow key={rate.id}>
              <TableCell className="font-medium">{rate.description}</TableCell>
              <TableCell>{rate.minConsumption}</TableCell>
              <TableCell>{rate.maxConsumption}</TableCell>
              <TableCell>{rate.rate.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(rate)} className="mr-2 hover:text-primary">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(rate)} className="hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
