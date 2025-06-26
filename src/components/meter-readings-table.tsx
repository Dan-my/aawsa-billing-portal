
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
import { Badge } from "@/components/ui/badge";
import type { DisplayReading } from "@/lib/data-store";
import { format, parseISO } from "date-fns";

interface MeterReadingsTableProps {
  data: DisplayReading[];
}

const MeterReadingsTable: React.FC<MeterReadingsTableProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PP"); // e.g., Sep 21, 2023
    } catch (e) {
      return dateString; // Fallback if parsing fails
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meter Identifier</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Reading Value</TableHead>
            <TableHead>Reading Date</TableHead>
            <TableHead>Month/Year</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((reading) => (
              <TableRow key={reading.id}>
                <TableCell className="font-medium">{reading.meterIdentifier}</TableCell>
                <TableCell>
                  <Badge variant={reading.meterType === 'bulk' ? "secondary" : "default"}>
                    {reading.meterType === 'individual' ? 'Individual' : 'Bulk'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{reading.readingValue.toFixed(2)}</TableCell>
                <TableCell>{formatDate(reading.readingDate)}</TableCell>
                <TableCell>{reading.monthYear}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{reading.notes || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No meter readings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.length > 10 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
            Displaying {data.length} readings. Pagination coming soon.
        </div>
      )}
    </div>
  );
};

export default MeterReadingsTable;
