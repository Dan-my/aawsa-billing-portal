
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
  paymentStatus: PaymentStatus; // e.g., 'Paid', 'Unpaid' for their current/last bill cycle
  calculatedBill: number; // The calculated bill amount for the current/last cycle
  created_at?: string | null;
  updated_at?: string | null;
};

// Note: CustomerType, SewerageConnection, PaymentStatus, TariffTier, calculateBill,
// DomesticTariffInfo, NonDomesticTariffInfo are now managed in src/lib/billing.ts
// to centralize billing logic and make it reusable.
// IndividualCustomer imports CustomerType and SewerageConnection types from there.
