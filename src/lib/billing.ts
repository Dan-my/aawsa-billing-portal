
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

// Sample Tariff Tiers - these should ideally come from a configuration or database
export const DomesticTariffTiersData: TariffTier[] = [
  { limit: 5, rate: 6.25, cumulativeUsage: 0 },
  { limit: 10, rate: 7.50, cumulativeUsage: 5 },
  { limit: 20, rate: 9.00, cumulativeUsage: 10 },
  { limit: 30, rate: 10.50, cumulativeUsage: 20 },
  { limit: Infinity, rate: 12.00, cumulativeUsage: 30 },
];

export const NonDomesticTariffTiersData: TariffTier[] = [
  { limit: 50, rate: 10.00, cumulativeUsage: 0 },
  { limit: 100, rate: 12.50, cumulativeUsage: 50 },
  { limit: Infinity, rate: 15.00, cumulativeUsage: 100 },
];

export const DomesticTariffInfo = {
  tiers: DomesticTariffTiersData,
  maintenancePercentage: 0.01, // 1%
  sanitationPercentage: 0.07,  // 7%
  meterRent: 15.00,
  sewerageRatePerM3: 6.25, // If sewerage connection is "Yes"
};

export const NonDomesticTariffInfo = {
  tiers: NonDomesticTariffTiersData,
  // Non-domestic might not have maintenance fee specified like domestic, or it's bundled.
  sanitationPercentage: 0.10, // 10%
  meterRent: 15.00, // Example, might differ
  sewerageRatePerM3: 8.75, // If sewerage connection is "Yes"
};

export function calculateBill(
  usageM3: number,
  customerType: CustomerType,
  sewerageConnection: SewerageConnection
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

  if (tariffConfig.meterRent) {
    totalBill += tariffConfig.meterRent;
  }

  if (sewerageConnection === "Yes" && tariffConfig.sewerageRatePerM3) {
    totalBill += usageM3 * tariffConfig.sewerageRatePerM3;
  }

  return parseFloat(totalBill.toFixed(2));
}
