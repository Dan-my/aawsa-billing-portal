// src/lib/billing.ts

import { getTariff } from "./data-store";

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const paymentStatuses = ['Paid', 'Unpaid', 'Pending'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export interface TariffTier {
  limit: number | typeof Infinity; 
  rate: number;
}

export interface TariffInfo {
    id: string;
    customer_type: CustomerType;
    tiers: TariffTier[];
    maintenance_percentage: number;
    sanitation_percentage: number;
    sewerage_rate_per_m3: number;
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

export const getTariffInfo = (type: CustomerType): TariffInfo | undefined => {
    return getTariff(type);
}


const VAT_RATE = 0.15; // 15% VAT

export interface BillCalculationResult {
  totalBill: number;
  baseWaterCharge: number;
  maintenanceFee: number;
  sanitationFee: number;
  vatAmount: number;
  meterRent: number;
  sewerageCharge: number;
}

export function calculateBill(
  usageM3: number,
  customerType: CustomerType,
  sewerageConnection: SewerageConnection,
  meterSize: number
): BillCalculationResult {
  let baseWaterCharge = 0;
  const tariffConfig = getTariffInfo(customerType);
  
  if (!tariffConfig) {
      console.error(`Tariff information for customer type "${customerType}" not found. Bill calculation will be incorrect.`);
      return { totalBill: 0, baseWaterCharge: 0, maintenanceFee: 0, sanitationFee: 0, vatAmount: 0, meterRent: 0, sewerageCharge: 0 };
  }
  
  const tiers = tariffConfig.tiers;

  // --- Base Water Charge Calculation ---
  if (customerType === "Domestic") {
    // Progressive calculation for Domestic customers
    let remainingUsage = usageM3;
    let lastTierLimit = 0;

    for (const tier of tiers) {
      if (remainingUsage <= 0) break;

      const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
      const usageInThisTier = Math.min(remainingUsage, tierLimit - lastTierLimit);
      baseWaterCharge += usageInThisTier * tier.rate;
      remainingUsage -= usageInThisTier;
      lastTierLimit = tierLimit;

      if (tierLimit === Infinity) {
        if (remainingUsage > 0) {
          baseWaterCharge += remainingUsage * tier.rate;
        }
        break;
      }
    }
  } else {
    // Non-progressive (flat rate based on consumption tier) for Non-domestic customers
    let applicableRate = 0;
    for (const tier of tiers) {
        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        if (usageM3 <= tierLimit) {
            applicableRate = tier.rate;
            break;
        }
    }
    // If usage exceeds the highest defined limit, use the last tier's rate
    if (applicableRate === 0 && tiers.length > 0) {
        applicableRate = tiers[tiers.length - 1].rate;
    }
    baseWaterCharge = usageM3 * applicableRate;
  }

  // --- Service Fees Calculation (based on total water charge) ---
  const maintenanceFee = (tariffConfig.maintenance_percentage ?? 0) * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitation_percentage ? baseWaterCharge * tariffConfig.sanitation_percentage : 0;
  
  // --- VAT Calculation ---
  let vatAmount = 0;
  if (customerType === 'Domestic') {
    const VAT_EXEMPTION_LIMIT = 15;
    if (usageM3 > VAT_EXEMPTION_LIMIT) {
      let taxableWaterCharge = 0;
      let cumulativeUsage = 0;

      // Recalculate water charge on the taxable portion only
      for (const tier of tiers) {
        const tierUpperLimit = tier.limit === Infinity ? usageM3 : Number(tier.limit);
        const consumptionInTier = Math.min(usageM3, tierUpperLimit) - cumulativeUsage;

        if (consumptionInTier <= 0) break;
        
        // The portion of usage in *this* tier that is above the 15m³ exemption
        const taxableStartPoint = Math.max(0, VAT_EXEMPTION_LIMIT - cumulativeUsage);
        const taxableUsageInTier = consumptionInTier - taxableStartPoint;

        if (taxableUsageInTier > 0) {
          taxableWaterCharge += taxableUsageInTier * tier.rate;
        }
        
        cumulativeUsage += consumptionInTier;
        if (cumulativeUsage >= usageM3) break;
      }

      vatAmount = taxableWaterCharge * VAT_RATE;
    }
  } else {
    // For Non-domestic, VAT is always applied on the base water charge.
    vatAmount = baseWaterCharge * VAT_RATE;
  }

  // --- Other Charges ---
  const METER_RENT_PRICES = getMeterRentPrices();
  const meterRent = METER_RENT_PRICES[String(meterSize)] || 0;
  const sewerageCharge = (sewerageConnection === "Yes" && tariffConfig.sewerage_rate_per_m3) ? usageM3 * tariffConfig.sewerage_rate_per_m3 : 0;

  // --- Final Total Bill ---
  const totalBill = baseWaterCharge + maintenanceFee + sanitationFee + vatAmount + meterRent + sewerageCharge;

  return {
    totalBill: parseFloat(totalBill.toFixed(2)),
    baseWaterCharge: parseFloat(baseWaterCharge.toFixed(2)),
    maintenanceFee: parseFloat(maintenanceFee.toFixed(2)),
    sanitationFee: parseFloat(sanitationFee.toFixed(2)),
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    meterRent: parseFloat(meterRent.toFixed(2)),
    sewerageCharge: parseFloat(sewerageCharge.toFixed(2)),
  };
}
