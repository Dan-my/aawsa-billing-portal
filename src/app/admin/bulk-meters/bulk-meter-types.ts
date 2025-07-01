
import type { z } from "zod";
import type { baseBulkMeterDataSchema } from "@/app/admin/data-entry/customer-data-entry-types";
import type { PaymentStatus } from "@/lib/billing"; // Import PaymentStatus from new location

export const bulkMeterStatuses = ['Active', 'Maintenance', 'Decommissioned'] as const;
export type BulkMeterStatus = (typeof bulkMeterStatuses)[number];

// This type represents the data structure for a bulk meter entity.
// It combines the fields from the data entry schema with a specific status.
// customerKeyNumber is now the primary identifier.
export type BulkMeter = z.infer<typeof baseBulkMeterDataSchema> & {
  // id: string; // Removed, customerKeyNumber is the PK
  status: BulkMeterStatus;
  paymentStatus: PaymentStatus; 
  outStandingbill: number; 
  branchId?: string; // New field for branch association
  bulkUsage?: number;
  totalBulkBill?: number;
  differenceUsage?: number;
  differenceBill?: number;
};
