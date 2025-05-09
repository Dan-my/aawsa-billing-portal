
import type { z } from "zod";
// Assuming individualCustomerDataEntrySchema already exists and is comprehensive
import type { baseIndividualCustomerDataSchema } from "@/app/admin/data-entry/customer-data-entry-types"; 

export const individualCustomerStatuses = ['Active', 'Inactive', 'Suspended'] as const;
export type IndividualCustomerStatus = (typeof individualCustomerStatuses)[number];

// Re-using customerTypes and sewerageConnections from data-entry as they are relevant for entity definition too
export { customerTypes, sewerageConnections } from "@/app/admin/data-entry/customer-data-entry-types";
export type { CustomerType, SewerageConnection } from "@/app/admin/data-entry/customer-data-entry-types";

export const paymentStatuses = ['Paid', 'Unpaid'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];


// This type represents the data structure for an individual customer entity.
// It combines the fields from the data entry schema with an ID and a specific status.
export type IndividualCustomer = z.infer<typeof baseIndividualCustomerDataSchema> & {
  id: string;
  status: IndividualCustomerStatus;
  // assignedBulkMeterId is already part of baseIndividualCustomerDataSchema and is mandatory
  paymentStatus: PaymentStatus; 
  calculatedBill: number;
};

export const TARIFF_RATE = 5.50; // ETB per m³ // Kept for reference or default bulk scenarios

export const TARIFF_RATES_BY_TYPE = {
  Domestic: 5.50, // ETB per m³
  "Non-domestic": 7.50, // ETB per m³
} as const;

export function getTariffRate(customerType: keyof typeof TARIFF_RATES_BY_TYPE): number {
  return TARIFF_RATES_BY_TYPE[customerType] || TARIFF_RATES_BY_TYPE.Domestic; // Fallback to domestic if type is somehow invalid
}

