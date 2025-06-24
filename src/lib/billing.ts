
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

// Renamed to indicate these are the default, fallback values.
export const DEFAULT_METER_RENT_PRICES: { [key: string]: number } = {
  "0.5": 15,    // 1/2"
  "0.75": 20,   // 3/4"
  "1": 33,      // 1"
  "1.25": 36,   // 1 1/4"
  "1.5": 57,    // 1 1/2"
  "2": 98,      // 2"
  "2.5": 112,   // 2 1/2"
  "3": 148,     // 3"
  "4": 177,     // 4"
  "5": 228,     // 5"
  "6": 259,     // 6"
};

export const METER_RENT_STORAGE_KEY = 'aawsa-meter-rent-prices';

// New function to get current meter rent prices, checking localStorage first.
export function getMeterRentPrices(): { [key: string]: number } {
  if (typeof window === 'undefined') {
    return DEFAULT_METER_RENT_PRICES;
  }
  const storedPrices = localStorage.getItem(METER_RENT_STORAGE_KEY);
  if (storedPrices) {
    try {
      const parsed = JSON.parse(storedPrices);
      if (Object.values(parsed).every(v => typeof v === 'number')) {
         return parsed;
      }
    } catch (e) {
      console.error("Failed to parse custom meter rent prices, using default.", e);
    }
  }
  return DEFAULT_METER_RENT_PRICES;
}


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
  sewerageRatePerM3: 6.25, // If sewerage connection is "Yes"
};

export const NonDomesticTariffInfo = {
  tiers: NonDomesticTariffTiersData,
  sanitationPercentage: 0.10, // 10%
  sewerageRatePerM3: 8.75, // If sewerage connection is "Yes"
};

const VAT_RATE = 0.15; // 15% VAT

export function calculateBill(
  usageM3: number,
  customerType: CustomerType,
  sewerageConnection: SewerageConnection,
  meterSize: number
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

  // Calculate service fees based on baseWaterCharge
  const maintenanceFee = (customerType === "Domestic" && tariffConfig.maintenancePercentage) 
                         ? baseWaterCharge * tariffConfig.maintenancePercentage 
                         : 0;
  
  const sanitationFee = tariffConfig.sanitationPercentage 
                        ? baseWaterCharge * tariffConfig.sanitationPercentage 
                        : 0;

  // Define the base for VAT calculation (Base + Service Fees)
  const vatBase = baseWaterCharge + maintenanceFee + sanitationFee;

  // Apply VAT
  const vatAmount = vatBase * VAT_RATE;

  // Calculate other charges that are not part of the VAT base
  const METER_RENT_PRICES = getMeterRentPrices();
  const meterRent = METER_RENT_PRICES[String(meterSize)] || 0;

  const sewerageCharge = (sewerageConnection === "Yes" && tariffConfig.sewerageRatePerM3) 
                         ? usageM3 * tariffConfig.sewerageRatePerM3 
                         : 0;

  // Calculate the final total bill by summing the VAT base, the calculated VAT, and other non-VAT charges
  const totalBill = vatBase + vatAmount + meterRent + sewerageCharge;

  return parseFloat(totalBill.toFixed(2));
}
