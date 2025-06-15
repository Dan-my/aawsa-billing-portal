
import type { z } from "zod";
import type { baseIndividualCustomerDataSchemaNew } from "@/app/admin/data-entry/customer-data-entry-types"; 

export const individualCustomerStatuses = ['Active', 'Inactive', 'Suspended'] as const;
export type IndividualCustomerStatus = (typeof individualCustomerStatuses)[number];

// This type represents the data structure for an individual customer entity based on the new schema.
export type IndividualCustomer = z.infer<typeof baseIndividualCustomerDataSchemaNew> & {
  id: string;
  status: IndividualCustomerStatus;
  created_at?: string | null; // from new schema
  updated_at?: string | null; // from new schema
};

// Constants for display in settings or info pages might need to be removed or updated
// if they relied on removed fields (like tariff tiers, etc.)
// For now, keeping them as they are not directly impacted by the table structure change alone,
// but their usage elsewhere might be.
export const DomesticTariffInfo = {
    tiers: [], // Simplified as underlying data is removed
    maintenancePercentage: 0.01,
    sanitationPercentage: 0.07,
    meterRent: 15.00,
    sewerageRatePerM3: 6.25,
};

export const NonDomesticTariffInfo = {
  tiers: [], // Simplified
  sanitationPercentage: 0.10,
  meterRent: 15.00,
  sewerageRatePerM3: 8.75,
};

// The calculateBill function and related detailed tariff structures are removed
// as the necessary input fields (currentReading, previousReading, customerType, sewerageConnection)
// are no longer part of the IndividualCustomer entity.
// If billing is still needed, it would have to be re-implemented based on a different data model or source.
