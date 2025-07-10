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
}

export interface TariffInfo {
    tiers: TariffTier[];
    maintenancePercentage: number;
    sanitationPercentage: number;
    sewerageRatePerM3: number;
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


// Default Tariff Tiers
export const DEFAULT_DOMESTIC_TIERS: TariffTier[] = [
  { limit: 5, rate: 10.21 },
  { limit: 14, rate: 17.87 },
  { limit: 23, rate: 33.19 },
  { limit: 32, rate: 51.07 },
  { limit: 41, rate: 61.28 },
  { limit: 50, rate: 71.49 },
  { limit: 56, rate: 81.71 },
  { limit: Infinity, rate: 81.71 },
];

export const DEFAULT_NON_DOMESTIC_TIERS: TariffTier[] = [
  { limit: 5, rate: 10.21 },
  { limit: 14, rate: 17.87 },
  { limit: 23, rate: 33.19 },
  { limit: 32, rate: 51.07 },
  { limit: 41, rate: 61.28 },
  { limit: 50, rate: 71.49 },
  { limit: 56, rate: 81.71 },
  { limit: Infinity, rate: 81.71 },
];

export const DomesticTariffInfo: TariffInfo = {
  tiers: DEFAULT_DOMESTIC_TIERS,
  maintenancePercentage: 0.01, // 1%
  sanitationPercentage: 0.07,  // 7%
  sewerageRatePerM3: 6.25, // If sewerage connection is "Yes"
};

export const NonDomesticTariffInfo: TariffInfo = {
  tiers: DEFAULT_NON_DOMESTIC_TIERS,
  maintenancePercentage: 0.01, // 1%
  sanitationPercentage: 0.10, // 10%
  sewerageRatePerM3: 8.75, // If sewerage connection is "Yes"
};

export const TARIFF_DOMESTIC_STORAGE_KEY = 'aawsa-tariff-domestic';
export const TARIFF_NON_DOMESTIC_STORAGE_KEY = 'aawsa-tariff-non-domestic';

export function getTariffInfo(type: CustomerType): TariffInfo {
  if (typeof window === 'undefined') {
    return type === 'Domestic' ? DomesticTariffInfo : NonDomesticTariffInfo;
  }
  const key = type === 'Domestic' ? TARIFF_DOMESTIC_STORAGE_KEY : TARIFF_NON_DOMESTIC_STORAGE_KEY;
  const storedInfo = localStorage.getItem(key);
  if (storedInfo) {
    try {
      const parsed = JSON.parse(storedInfo);
      // Basic validation
      if (Array.isArray(parsed.tiers) && typeof parsed.maintenancePercentage === 'number') {
        return parsed;
      }
    } catch (e) {
      console.error(`Failed to parse custom tariff for ${type}, using defaults.`, e);
    }
  }
  return type === 'Domestic' ? DomesticTariffInfo : NonDomesticTariffInfo;
}

export function saveTariffInfo(type: CustomerType, info: TariffInfo): void {
  if (typeof window !== 'undefined') {
    const key = type === 'Domestic' ? TARIFF_DOMESTIC_STORAGE_KEY : TARIFF_NON_DOMESTIC_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(info));
  }
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
  const tiers = tariffConfig.tiers;

  // --- Base Water Charge Calculation ---
  if (customerType === "Domestic") {
    // Progressive calculation for Domestic customers
    let remainingUsage = usageM3;
    let lastTierLimit = 0;

    for (const tier of tiers) {
      if (remainingUsage <= 0) break;

      const usageInThisTier = Math.min(remainingUsage, tier.limit - lastTierLimit);
      baseWaterCharge += usageInThisTier * tier.rate;
      remainingUsage -= usageInThisTier;
      lastTierLimit = tier.limit;

      if (tier.limit === Infinity) {
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
        if (usageM3 <= tier.limit) {
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
  const maintenanceFee = (tariffConfig.maintenancePercentage ?? 0) * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitationPercentage ? baseWaterCharge * tariffConfig.sanitationPercentage : 0;
  
  // --- VAT Calculation ---
  let vatAmount = 0;
  if (customerType === 'Domestic') {
    const VAT_EXEMPTION_LIMIT = 15;
    if (usageM3 > VAT_EXEMPTION_LIMIT) {
      let taxableWaterCharge = 0;
      let cumulativeUsage = 0;

      // Recalculate water charge on the taxable portion only
      for (const tier of tiers) {
        const tierUpperLimit = tier.limit === Infinity ? usageM3 : tier.limit;
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
  const sewerageCharge = (sewerageConnection === "Yes" && tariffConfig.sewerageRatePerM3) ? usageM3 * tariffConfig.sewerageRatePerM3 : 0;

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
