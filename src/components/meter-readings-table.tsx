
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
import type { DomainMeterReading } from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { format, parseISO } from "date-fns";

interface MeterReadingsTableProps {
  data: DomainMeterReading[];
  customers: Pick<IndividualCustomer, 'id' | 'name' | 'meterNumber'>[];
  bulkMeters: Pick<BulkMeter, 'id' | 'name' | 'meterNumber'>[];
}

const MeterReadingsTable: React.FC<MeterReadingsTableProps> = ({ data, customers, bulkMeters }) => {

  const getMeterIdentifier = (reading: DomainMeterReading): string => {
    if (reading.meterType === 'individual_customer_meter' && reading.individualCustomerId) {
      const customer = customers.find(c => c.id === reading.individualCustomerId);
      return customer ? `${customer.name} (M: ${customer.meterNumber || 'N/A'})` : `Customer ID: ${reading.individualCustomerId}`;
    }
    if (reading.meterType === 'bulk_meter' && reading.bulkMeterId) {
      const bulkMeter = bulkMeters.find(bm => bm.id === reading.bulkMeterId);
      return bulkMeter ? `${bulkMeter.name} (M: ${bulkMeter.meterNumber || 'N/A'})` : `Bulk Meter ID: ${reading.bulkMeterId}`;
    }
    return "Unknown Meter";
  };
  
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
                <TableCell className="font-medium">{getMeterIdentifier(reading)}</TableCell>
                <TableCell>
                  <Badge variant={reading.meterType === 'bulk_meter' ? "secondary" : "default"}>
                    {reading.meterType === 'individual_customer_meter' ? 'Individual' : 'Bulk'}
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
                No meter readings found for this branch.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Placeholder for Pagination */}
      {data.length > 10 && ( // Show pagination info if more than 10 items for example
        <div className="mt-4 text-center text-sm text-muted-foreground">
            Displaying {data.length} readings. Pagination coming soon.
        </div>
      )}
    </div>
  );
};

export default MeterReadingsTable;
