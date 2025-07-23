
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
      console.warn(`Tariff information for customer type "${customerType}" for year ${year} not found. Bill calculation will be 0.`);
      return emptyResult;
  }
  
  const tiers = tariffConfig.tiers.sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
  let baseWaterCharge = 0;
  let waterChargeForVat = 0; // Specific for domestic VAT calculation

  // Get VAT settings from the database tariff config
  const VAT_RATE = tariffConfig.vat_rate ?? 0.15; // Default to 15% if not in DB
  const DOMESTIC_VAT_THRESHOLD = tariffConfig.domestic_vat_threshold_m3 ?? 15; // Default to 15m³ if not in DB


  if (customerType === 'Domestic') {
    // Progressive calculation for Domestic
    let remainingUsage = usageM3;
    let lastLimit = 0;

    for (const tier of tiers) {
      if (remainingUsage <= 0) break;

      const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
      const tierRate = Number(tier.rate);
      const tierBlockSize = tierLimit - lastLimit;
      
      const usageInThisTier = Math.min(remainingUsage, tierBlockSize);
      const chargeInThisTier = usageInThisTier * tierRate;
      baseWaterCharge += chargeInThisTier;

      // Check if this tier contributes to the VAT-able amount
      if (lastLimit + usageInThisTier > DOMESTIC_VAT_THRESHOLD) {
          // Calculate how much of the usage in *this specific tier* is above the threshold
          const vatApplicableUsageInTier = (lastLimit + usageInThisTier) - Math.max(lastLimit, DOMESTIC_VAT_THRESHOLD);
          waterChargeForVat += vatApplicableUsageInTier * tierRate;
      }
      
      remainingUsage -= usageInThisTier;
      lastLimit = tierLimit;
    }

  } else {
    // Flat-rate tier logic for Non-domestic
    let applicableRate = 0;
    for (const tier of tiers) {
        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        if (usageM3 <= tierLimit) {
            applicableRate = Number(tier.rate);
            break;
        }
    }
    // If usage exceeds all defined limits, use the rate of the last (highest) tier.
    if (applicableRate === 0 && tiers.length > 0) {
        applicableRate = Number(tiers[tiers.length - 1].rate);
    }
    baseWaterCharge = usageM3 * applicableRate;
  }

  const maintenanceFee = (tariffConfig.maintenance_percentage ?? 0) * baseWaterCharge;
  const sanitationFee = (tariffConfig.sanitation_percentage ?? 0) * baseWaterCharge;
  
  let vatAmount = 0;
  if (customerType === 'Domestic') {
    // For domestic, VAT is calculated only on the charge for usage above the threshold.
    if (usageM3 > DOMESTIC_VAT_THRESHOLD) {
        vatAmount = waterChargeForVat * VAT_RATE;
    }
  } else {
    // For non-domestic, VAT is applied to the entire base water charge.
    vatAmount = baseWaterCharge * VAT_RATE;
  }

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
