
import type { z } from "zod";
import type { baseIndividualCustomerDataSchemaNew } from "@/app/admin/data-entry/customer-data-entry-types"; 

export const individualCustomerStatuses = ['Active', 'Inactive', 'Suspended'] as const;
export type IndividualCustomerStatus = (typeof individualCustomerStatuses)[number];

// This type represents the data structure for an individual customer entity based on the new schema.
export type IndividualCustomer = z.infer<typeof baseIndividualCustomerDataSchemaNew> & {
  id: string;
  status: IndividualCustomerStatus;
  created_at?: string | null; 
  updated_at?: string | null; 
};

// Constants for TariffTier, DomesticTariffInfo, NonDomesticTariffInfo, PaymentStatus, and calculateBill
// have been moved to src/lib/billing.ts to centralize billing logic.
// If billing for individual customers is re-introduced with different fields,
// that logic would need to be added here or in a dedicated billing service for individuals.

