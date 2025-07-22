// src/lib/billing.ts

import { getTariff } from './data-store';
import type { TariffInfo, TariffTier } from './data-store';

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const paymentStatuses = ['Paid', 'Unpaid', 'Pending'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

// This function now uses the centralized getTariff function from the data-store.
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
  
  const tiers = tariffConfig.tiers.sort((a, b) => a.limit - b.limit);
  let baseWaterCharge = 0;

  // --- Base Water Charge Calculation ---
  if (customerType === "Domestic") {
    let remainingUsage = usageM3;
    let previousTierLimit = 0;
    
    for (const tier of tiers) {
        if (remainingUsage <= 0) break;
        const currentTierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        const tierRange = currentTierLimit - previousTierLimit;
        const usageInThisTier = Math.min(remainingUsage, tierRange);
        
        baseWaterCharge += usageInThisTier * tier.rate;
        remainingUsage -= usageInThisTier;
        previousTierLimit = currentTierLimit;
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
      const lastTier = tiers[tiers.length - 1];
      if (lastTier.limit !== Infinity) {
          applicableRate = lastTier.rate;
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
      let remainingTaxableUsage = usageM3;
      let previousTierLimit = 0;

      for (const tier of tiers) {
          if (remainingTaxableUsage <= 0) break;

          const currentTierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
          const tierStart = Math.max(previousTierLimit, VAT_EXEMPTION_LIMIT);
          
          if(currentTierLimit > VAT_EXEMPTION_LIMIT) {
             const usageInTaxablePortionOfTier = Math.min(remainingTaxableUsage, currentTierLimit - tierStart)
             if (usageInTaxablePortionOfTier > 0) {
                taxableWaterCharge += usageInTaxablePortionOfTier * tier.rate;
                remainingTaxableUsage -= (currentTierLimit - previousTierLimit);
             }
          }
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
  
  const sewerageChargeRate = tariffConfig.sewerage_rate_per_m3;
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
