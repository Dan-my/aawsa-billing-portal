
// src/lib/billing.ts

import { getTariff } from './data-store'; // Use data-store to get tariffs
import type { TariffInfo } from './data-store';

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

// This function now uses the centralized getTariff function from the data-store.
export const getTariffInfo = async (type: CustomerType, year: number): Promise<TariffInfo | undefined> => {
    // The data-store's getTariff function will handle fetching and ensuring data is up-to-date.
    return getTariff(type, year);
};


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

export async function calculateBill(
  usageM3: number,
  customerType: CustomerType,
  sewerageConnection: SewerageConnection,
  meterSize: number,
  billingMonth: string // e.g., "2024-05"
): Promise<BillCalculationResult> {
  const emptyResult = { totalBill: 0, baseWaterCharge: 0, maintenanceFee: 0, sanitationFee: 0, vatAmount: 0, meterRent: 0, sewerageCharge: 0 };
  
  if (!billingMonth || typeof billingMonth !== 'string' || !billingMonth.match(/^\d{4}-\d{2}$/)) {
    console.error(`Invalid billingMonth provided: ${billingMonth}. Calculation cannot proceed.`);
    return emptyResult;
  }

  const year = parseInt(billingMonth.split('-')[0], 10);
  if (isNaN(year)) {
      console.error(`Invalid billingMonth format: "${billingMonth}". Could not extract year.`);
      return emptyResult;
  }

  // Fetch the tariff configuration directly from the data-store for the given year.
  // The data-store now ensures this is fresh data from the DB.
  const tariffConfig = await getTariffInfo(customerType, year);
  
  // If no tariff config is found in the database for that year, return 0 for all values.
  if (!tariffConfig) {
      console.error(`Tariff information for customer type "${customerType}" for year ${year} not found in database. Bill calculation will be 0.`);
      return emptyResult;
  }
  
  const tiers = tariffConfig.tiers;
  let baseWaterCharge = 0;

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
  // Use only the prices from the fetched tariff. No defaults.
  const meterRentPrices = tariffConfig.meter_rent_prices || {};
  const meterRent = meterRentPrices[String(meterSize)] || 0; // If no price for size, rent is 0
  
  const sewerageChargeRate = tariffConfig.sewerage_rate_per_m3;
  const sewerageCharge = (sewerageConnection === "Yes") ? usageM3 * sewerageChargeRate : 0;

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
