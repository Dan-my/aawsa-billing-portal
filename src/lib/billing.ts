// src/lib/billing.ts

import { getTariff } from './data-store';
import type { TariffInfo, TariffTier } from './data-store';

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const paymentStatuses = ['Paid', 'Unpaid', 'Pending'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const getTariffInfo = async (type: CustomerType, year: number): Promise<TariffInfo | undefined> => {
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
  const emptyResult: BillCalculationResult = { totalBill: 0, baseWaterCharge: 0, maintenanceFee: 0, sanitationFee: 0, vatAmount: 0, meterRent: 0, sewerageCharge: 0 };
  
  if (usageM3 < 0) {
    return emptyResult;
  }
  
  if (!billingMonth || typeof billingMonth !== 'string' || !billingMonth.match(/^\d{4}-\d{2}$/)) {
    console.error(`Invalid billingMonth provided: ${billingMonth}. Calculation cannot proceed.`);
    return emptyResult;
  }

  const year = parseInt(billingMonth.split('-')[0], 10);
  const tariffConfig = await getTariffInfo(customerType, year);
  
  if (!tariffConfig || !tariffConfig.tiers || tariffConfig.tiers.length === 0) {
      console.warn(`Tariff information for customer type "${customerType}" for year ${year} not found in database. Bill calculation will be 0.`);
      return emptyResult;
  }
  
  const tiers = tariffConfig.tiers.sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
  let baseWaterCharge = 0;

  if (customerType === 'Domestic') {
    // Progressive calculation for Domestic customers
    let remainingUsage = usageM3;
    let previousLimit = 0;

    for (const tier of tiers) {
      if (remainingUsage <= 0) break;
      
      const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
      const tierRange = tierLimit - previousLimit;
      const usageInTier = Math.min(remainingUsage, tierRange);

      baseWaterCharge += usageInTier * Number(tier.rate);
      remainingUsage -= usageInTier;
      previousLimit = tierLimit;
    }
  } else {
    // Flat-rate tier calculation for Non-domestic customers
    let applicableRate = 0;
    for (const tier of tiers) {
        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        if (usageM3 <= tierLimit) {
            applicableRate = Number(tier.rate);
            break;
        }
    }
    // If usage exceeds all defined finite limits, use the rate of the "Infinity" tier if it exists.
    if (applicableRate === 0 && tiers.length > 0) {
        const infinityTier = tiers.find(t => t.limit === Infinity);
        if (infinityTier) {
            applicableRate = Number(infinityTier.rate);
        } else {
            // Fallback to the last tier's rate if no infinity tier is defined.
            applicableRate = Number(tiers[tiers.length - 1].rate);
        }
    }
    baseWaterCharge = usageM3 * applicableRate;
  }

  // --- Service Fees Calculation (based on total water charge) ---
  const maintenanceFee = (tariffConfig.maintenance_percentage ?? 0) * baseWaterCharge;
  const sanitationFee = (tariffConfig.sanitation_percentage ?? 0) * baseWaterCharge;
  
  // --- VAT Calculation ---
  let vatAmount = 0;
  if (customerType === 'Domestic') {
    if (usageM3 > 15) {
      // Find the portion of the water charge related to consumption above 15m3
      let remainingUsageForVat = usageM3;
      let previousLimitForVat = 0;
      let chargeForVatEligibleUsage = 0;

      for (const tier of tiers) {
          if (remainingUsageForVat <= 0) break;

          const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
          const tierRange = tierLimit - previousLimitForVat;
          const usageInTier = Math.min(remainingUsageForVat, tierRange);
          
          // Check how much of the usage in this tier is above the 15m3 threshold
          const vatEligibleStart = Math.max(15, previousLimitForVat);
          if (tierLimit > vatEligibleStart) {
              const vatUsageInTier = Math.max(0, Math.min(tierLimit, previousLimitForVat + usageInTier) - vatEligibleStart);
              chargeForVatEligibleUsage += vatUsageInTier * Number(tier.rate);
          }
          
          remainingUsageForVat -= usageInTier;
          previousLimitForVat = tierLimit;
      }
      vatAmount = chargeForVatEligibleUsage * VAT_RATE;
    }
  } else {
    vatAmount = baseWaterCharge * VAT_RATE;
  }

  // --- Other Charges ---
  const meterRentPrices = tariffConfig.meter_rent_prices || {};
  const meterRent = meterRentPrices[String(meterSize)] || 0;
  
  const sewerageChargeRate = tariffConfig.sewerage_rate_per_m3 || 0;
  const sewerageCharge = (sewerageConnection === "Yes") ? usageM3 * sewerageChargeRate : 0;

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
