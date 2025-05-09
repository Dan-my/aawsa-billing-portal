
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
  paymentStatus: PaymentStatus; 
  calculatedBill: number;
};

// For non-domestic customers and bulk meter's own billing (if applicable as flat rate)
export const NON_DOMESTIC_FLAT_RATE = 7.50; // ETB per m³

const DOMESTIC_METER_RENT = 15;
const DOMESTIC_SEWERAGE_RATE_PER_M3 = 6.25;
const DOMESTIC_MAINTENANCE_PERCENTAGE = 0.01; // 1%
const DOMESTIC_SANITATION_PERCENTAGE = 0.07; // 7%

interface DomesticTariffTier {
  limit: number; // Upper limit of the tier (e.g., 5 for 1-5 M3)
  rate: number;  // Rate for this tier
  cumulativeUsage?: number; // Max usage covered by previous tiers
  cumulativeCharge?: number; // Max charge from previous tiers
}

const domesticTariffTiers: DomesticTariffTier[] = [
  { limit: 5, rate: 10.21 },
  { limit: 14, rate: 17.87 },
  { limit: 23, rate: 33.19 },
  { limit: 32, rate: 51.07 },
  { limit: 41, rate: 61.28 },
  { limit: 50, rate: 71.49 },
  { limit: Infinity, rate: 81.71 }, // For consumption above 50 M3
];

// Pre-calculate cumulative values for faster calculation
let accumulatedUsage = 0;
let accumulatedCharge = 0;
for (const tier of domesticTariffTiers) {
  if (tier.limit !== Infinity && tier.limit - accumulatedUsage > 0) {
    tier.cumulativeUsage = accumulatedUsage;
    tier.cumulativeCharge = accumulatedCharge;
    const usageInTier = tier.limit - accumulatedUsage;
    accumulatedCharge += usageInTier * tier.rate;
    accumulatedUsage = tier.limit;
  } else if (tier.limit === Infinity) {
    tier.cumulativeUsage = accumulatedUsage; // Usage up to the start of this "infinity" tier
    tier.cumulativeCharge = accumulatedCharge; // Charge up to the start of this "infinity" tier
  }
}


function calculateDomesticBaseWaterCharge(usage: number): number {
  if (usage <= 0) return 0;
  let totalCharge = 0;
  let remainingUsage = usage;

  for (const tier of domesticTariffTiers) {
    const previousTiersUsage = tier.cumulativeUsage ?? 0;
    if (usage > previousTiersUsage) {
        const usageInThisTier = Math.min(remainingUsage, (tier.limit === Infinity ? Infinity : tier.limit) - previousTiersUsage);
        totalCharge += usageInThisTier * tier.rate;
        remainingUsage -= usageInThisTier;
        if (remainingUsage <= 0) break;
    } else {
        break; 
    }
  }
  return totalCharge;
}

export function calculateBill(
  usage: number, 
  customerType: CustomerType, 
  sewerageConnection: SewerageConnection
): number {
  if (usage < 0) usage = 0; // Ensure usage is not negative

  if (customerType === "Non-domestic") {
    return usage * NON_DOMESTIC_FLAT_RATE;
  }

  // Domestic customer calculation
  const baseWaterCharge = calculateDomesticBaseWaterCharge(usage);
  
  const maintenanceFee = baseWaterCharge * DOMESTIC_MAINTENANCE_PERCENTAGE;
  const sanitationFee = baseWaterCharge * DOMESTIC_SANITATION_PERCENTAGE;
  const meterRentFee = DOMESTIC_METER_RENT;
  const sewerageFee = sewerageConnection === "Yes" ? usage * DOMESTIC_SEWERAGE_RATE_PER_M3 : 0;

  const totalBill = baseWaterCharge + maintenanceFee + sanitationFee + meterRentFee + sewerageFee;
  
  return parseFloat(totalBill.toFixed(2)); // Return rounded to 2 decimal places
}

// This function is now superseded by calculateBill for bill calculation.
// It's kept here if TARIFF_RATES_BY_TYPE is used elsewhere for display or flat rate purposes.
export const TARIFF_RATES_BY_TYPE = {
  Domestic: null, // Domestic is progressive, not a single rate.
  "Non-domestic": NON_DOMESTIC_FLAT_RATE,
} as const;

/**
 * @deprecated Use calculateBill for actual bill calculation. This function might be misleading for domestic customers.
 * Returns a flat rate for non-domestic or a placeholder for domestic.
 */
export function getTariffRate(customerType: CustomerType): number | null {
  if (customerType === "Domestic") {
    // Domestic has a progressive tariff, so a single rate isn't representative.
    // This function should ideally not be used for domestic bill calculation.
    console.warn("getTariffRate called for Domestic customer. Use calculateBill for accurate progressive billing.");
    return null; 
  }
  return TARIFF_RATES_BY_TYPE[customerType as "Non-domestic"];
}
