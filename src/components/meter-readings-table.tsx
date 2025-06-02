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

interface MeterReading {
  id: string; // Assuming each reading has a unique ID
  meterNumber: string;
  reading: number;
  date: string; // Or Date object, depending on your data
  status: string;
}

interface MeterReadingsTableProps {
  data: MeterReading[];
}

const MeterReadingsTable: React.FC<MeterReadingsTableProps> = ({ data }) => {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meter Number</TableHead>
            <TableHead>Reading</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            {/* Add more headers if needed */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((reading) => (
              <TableRow key={reading.id}>
                <TableCell>{reading.meterNumber}</TableCell>
                <TableCell>{reading.reading}</TableCell>
                <TableCell>{reading.date}</TableCell>
                <TableCell>{reading.status}</TableCell>
                {/* Add more cells if needed */}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No meter readings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Placeholder for Pagination */}
      <div className="mt-4 text-center text-muted-foreground">
        Pagination coming soon.
      </div>

      {/* Placeholder for Sorting */}
      <div className="mt-2 text-center text-muted-foreground">
        Sorting coming soon.
      </div>
    </div>
  );
};

export default MeterReadingsTable;