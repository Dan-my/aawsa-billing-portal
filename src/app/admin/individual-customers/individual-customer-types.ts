
import type { z } from "zod";
import type { individualCustomerDataEntrySchema } from "@/app/admin/data-entry/customer-data-entry-types";
import type { PaymentStatus, CustomerType, SewerageConnection } from "@/lib/billing";

export const individualCustomerStatuses = ['Active', 'Inactive', 'Suspended'] as const;
export type IndividualCustomerStatus = (typeof individualCustomerStatuses)[number];

// This type represents the data structure for an individual customer entity.
// It combines the fields from the data entry schema with an ID and operational/billing fields.
export type IndividualCustomer = z.infer<typeof individualCustomerDataEntrySchema> & {
  id: string;
  status: IndividualCustomerStatus;
  paymentStatus: PaymentStatus; 
  calculatedBill: number; 
  arrears: number; // Added arrears
  branchId?: string; // New field for branch association
  created_at?: string | null;
  updated_at?: string | null;
};
