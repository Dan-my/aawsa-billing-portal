// src/lib/billing.ts

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const paymentStatuses = ['Paid', 'Unpaid', 'Pending'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export interface TariffTier {
  limit: number; // Upper limit of this tier (m³)
  rate: number; // Price per m³ in this tier
  cumulativeUsage?: number; // For display purposes in settings
}

// New map for meter rent prices based on your image
export const METER_RENT_PRICES: { [key: number]: number } = {
  0.5: 15,    // 1/2"
  0.75: 20,   // 3/4"
  1: 33,      // 1"
  1.25: 36,   // 1 1/4"
  1.5: 57,    // 1 1/2"
  2: 98,      // 2"
  2.5: 112,   // 2 1/2"
  3: 148,     // 3"
  4: 177,     // 4"
  5: 228,     // 5"
  6: 259,     // 6"
};

// Tariff Tiers based on the provided image
export const DomesticTariffTiersData: TariffTier[] = [
  { limit: 5, rate: 10.21, cumulativeUsage: 0 },
  { limit: 14, rate: 17.87, cumulativeUsage: 5 },
  { limit: 23, rate: 33.19, cumulativeUsage: 14 },
  { limit: 32, rate: 51.07, cumulativeUsage: 23 },
  { limit: 41, rate: 61.28, cumulativeUsage: 32 },
  { limit: 50, rate: 71.49, cumulativeUsage: 41 },
  { limit: 56, rate: 81.71, cumulativeUsage: 50 },
  { limit: Infinity, rate: 81.71, cumulativeUsage: 56 },
];

export const NonDomesticTariffTiersData: TariffTier[] = [
  { limit: 5, rate: 10.21, cumulativeUsage: 0 },
  { limit: 14, rate: 17.87, cumulativeUsage: 5 },
  { limit: 23, rate: 33.19, cumulativeUsage: 14 },
  { limit: 32, rate: 51.07, cumulativeUsage: 23 },
  { limit: 41, rate: 61.28, cumulativeUsage: 32 },
  { limit: 50, rate: 71.49, cumulativeUsage: 41 },
  { limit: 56, rate: 81.71, cumulativeUsage: 50 },
  { limit: Infinity, rate: 81.71, cumulativeUsage: 56 },
];

export const DomesticTariffInfo = {
  tiers: DomesticTariffTiersData,
  maintenancePercentage: 0.01, // 1%
  sanitationPercentage: 0.07,  // 7%
  // meterRent is now dynamic
  sewerageRatePerM3: 6.25, // If sewerage connection is "Yes"
};

export const NonDomesticTariffInfo = {
  tiers: NonDomesticTariffTiersData,
  // Non-domestic has no maintenance fee specified in the image
  sanitationPercentage: 0.10, // 10%
  // meterRent is now dynamic
  sewerageRatePerM3: 8.75, // If sewerage connection is "Yes"
};

export function calculateBill(
  usageM3: number,
  customerType: CustomerType,
  sewerageConnection: SewerageConnection,
  meterSize: number // New parameter
): number {
  let baseWaterCharge = 0;
  let remainingUsage = usageM3;
  let lastTierLimit = 0;

  const tariffConfig = customerType === "Domestic" ? DomesticTariffInfo : NonDomesticTariffInfo;
  const tiers = tariffConfig.tiers;

  for (const tier of tiers) {
    if (remainingUsage <= 0) break;

    const usageInThisTier = Math.min(remainingUsage, tier.limit - lastTierLimit);
    baseWaterCharge += usageInThisTier * tier.rate;
    remainingUsage -= usageInThisTier;
    lastTierLimit = tier.limit;

    if (tier.limit === Infinity && remainingUsage > 0) {
      baseWaterCharge += remainingUsage * tier.rate;
      remainingUsage = 0;
    }
     if (tier.limit === Infinity) break;
  }

  let totalBill = baseWaterCharge;

  if (customerType === "Domestic" && tariffConfig.maintenancePercentage) {
    totalBill += baseWaterCharge * tariffConfig.maintenancePercentage;
  }

  if (tariffConfig.sanitationPercentage) {
    totalBill += baseWaterCharge * tariffConfig.sanitationPercentage;
  }

  // Use the meter rent from the new map
  const meterRent = METER_RENT_PRICES[meterSize] || 0; // Default to 0 if size not found
  totalBill += meterRent;


  if (sewerageConnection === "Yes" && tariffConfig.sewerageRatePerM3) {
    totalBill += usageM3 * tariffConfig.sewerageRatePerM3;
  }

  return parseFloat(totalBill.toFixed(2));
}
