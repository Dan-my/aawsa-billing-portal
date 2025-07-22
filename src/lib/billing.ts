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

  // --- Base Water Charge Calculation ---
  if (customerType === "Domestic") {
    let remainingUsage = usageM3;
    let previousTierLimit = 0;

    for (const tier of tiers) {
        if (remainingUsage <= 0) break;

        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        const usageInThisTier = Math.min(remainingUsage, tierLimit - previousTierLimit);
        
        baseWaterCharge += usageInThisTier * tier.rate;
        remainingUsage -= usageInThisTier;
        previousTierLimit = tierLimit;
    }
  } else { // Non-domestic
    let applicableRate = 0;
    // Find the correct tier for the total consumption
    for (const tier of tiers) {
      if (usageM3 <= tier.limit) {
        applicableRate = tier.rate;
        break;
      }
    }
    // If usage is higher than the last defined tier's limit, use that last tier's rate
    if (applicableRate === 0 && tiers.length > 0) {
      const lastTierWithFiniteLimit = [...tiers].reverse().find(t => t.limit !== Infinity);
      const infinityTier = tiers.find(t => t.limit === Infinity);

      if (infinityTier && usageM3 > (lastTierWithFiniteLimit?.limit ?? 0)) {
          applicableRate = infinityTier.rate;
      } else if (lastTierWithFiniteLimit) {
           applicableRate = lastTierWithFiniteLimit.rate;
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
    const VAT_EXEMPTION_LIMIT = 15;
    if (usageM3 > VAT_EXEMPTION_LIMIT) {
      let taxableWaterCharge = 0;
      let remainingUsageForVat = usageM3;
      let previousTierLimit = 0;

      for (const tier of tiers) {
        if (remainingUsageForVat <= 0) break;

        const currentTierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        const consumptionInTier = Math.min(remainingUsageForVat, currentTierLimit - previousTierLimit);
        
        // Determine the taxable portion of consumption within this tier
        const tierStart = previousTierLimit;
        const tierEnd = previousTierLimit + consumptionInTier;
        
        const taxableStartPoint = Math.max(tierStart, VAT_EXEMPTION_LIMIT);
        const taxableEndPoint = Math.min(tierEnd, currentTierLimit);

        if (taxableEndPoint > taxableStartPoint) {
            const taxableUsageInTier = taxableEndPoint - taxableStartPoint;
            taxableWaterCharge += taxableUsageInTier * tier.rate;
        }

        remainingUsageForVat -= consumptionInTier;
        previousTierLimit = currentTierLimit;
      }
      vatAmount = taxableWaterCharge * VAT_RATE;
    }
  } else { // Non-domestic
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
