
"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from 'date-fns';

interface ReportDataViewProps {
  data: any[];
  headers: string[];
}

export function ReportDataView({ data, headers }: ReportDataViewProps) {
  
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "-";
    }
    if (typeof value === 'boolean') {
      return value ? "Yes" : "No";
    }
    // Check if it's a date-like string (YYYY-MM-DDTHH:mm:ss.sssZ)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        try {
            return format(parseISO(value), 'PP pp'); // e.g., Jan 1, 2023, 12:00:00 PM
        } catch {
            // Not a valid date, fall back to default
        }
    }
    if (typeof value === 'number') {
        // Check if it looks like a price or a reading
        if (String(value).includes('.')) {
            return value.toFixed(2);
        }
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <ScrollArea className="h-[500px] w-full border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-muted z-10">
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header) => (
                  <TableCell key={`${rowIndex}-${header}`} className="text-xs">
                    {formatValue(row[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} className="h-24 text-center">
                No data to display.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
