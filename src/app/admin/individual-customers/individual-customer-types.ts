
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

// Non-domestic tariff tiers
interface NonDomesticTariffTier {
  limit: number; // Upper limit of the tier (m³)
  rate: number;  // Rate for this tier (ETB/m³)
}

export const nonDomesticTariffTiers: NonDomesticTariffTier[] = [
  { limit: 200, rate: 30.00 },       // Tier 1: 0 - 200 m³
  { limit: Infinity, rate: 40.00 },  // Tier 2: Above 200 m³
];


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

export const domesticTariffTiers: DomesticTariffTier[] = [
  { limit: 5, rate: 10.21 },
  { limit: 14, rate: 17.87 },
  { limit: 23, rate: 33.19 },
  { limit: 32, rate: 51.07 },
  { limit: 41, rate: 61.28 },
  { limit: 50, rate: 71.49 },
  { limit: Infinity, rate: 81.71 }, // For consumption above 50 M3
];

// Pre-calculate cumulative values for domestic tariff
let accumulatedDomesticUsage = 0;
let accumulatedDomesticCharge = 0;
for (const tier of domesticTariffTiers) {
  if (tier.limit !== Infinity && tier.limit - accumulatedDomesticUsage > 0) {
    tier.cumulativeUsage = accumulatedDomesticUsage;
    tier.cumulativeCharge = accumulatedDomesticCharge;
    const usageInTier = tier.limit - accumulatedDomesticUsage;
    accumulatedDomesticCharge += usageInTier * tier.rate;
    accumulatedDomesticUsage = tier.limit;
  } else if (tier.limit === Infinity) {
    tier.cumulativeUsage = accumulatedDomesticUsage; 
    tier.cumulativeCharge = accumulatedDomesticCharge; 
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

function calculateNonDomesticBill(usage: number): number {
  if (usage <= 0) return 0;
  let totalCharge = 0;

  if (usage <= nonDomesticTariffTiers[0].limit) { // Tier 1: 0 - 200 m³
    totalCharge = usage * nonDomesticTariffTiers[0].rate;
  } else { // Tier 2: Above 200 m³
    // Charge for the first 200 m³
    totalCharge = nonDomesticTariffTiers[0].limit * nonDomesticTariffTiers[0].rate;
    // Charge for the remaining usage
    const remainingUsage = usage - nonDomesticTariffTiers[0].limit;
    totalCharge += remainingUsage * nonDomesticTariffTiers[1].rate;
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
    return parseFloat(calculateNonDomesticBill(usage).toFixed(2));
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


export const TARIFF_RATES_BY_TYPE = {
  Domestic: null, // Domestic is progressive, not a single rate.
  "Non-domestic": null, // Non-domestic is now also progressive.
} as const;

/**
 * @deprecated Use calculateBill for actual bill calculation. This function might be misleading as both customer types now use progressive tariffs.
 * Returns null for both types as they are progressive.
 */
export function getTariffRate(customerType: CustomerType): number | null {
  console.warn(`getTariffRate called for ${customerType} customer. Use calculateBill for accurate progressive billing. This function will return null.`);
  return null;
}
