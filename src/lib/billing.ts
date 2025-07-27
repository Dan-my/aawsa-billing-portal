

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

  const VAT_RATE = tariffConfig.vat_rate;
  const DOMESTIC_VAT_THRESHOLD = tariffConfig.domestic_vat_threshold_m3;

  // Progressive calculation for ALL customer types, as per database structure.
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

    // Domestic VAT is calculated only on the portion of the bill for usage over the threshold.
    if (customerType === 'Domestic' && lastLimit + usageInThisTier > DOMESTIC_VAT_THRESHOLD) {
        const vatApplicableUsageInTier = (lastLimit + usageInThisTier) - Math.max(lastLimit, DOMESTIC_VAT_THRESHOLD);
        waterChargeForVat += vatApplicableUsageInTier * tierRate;
    }
    
    remainingUsage -= usageInThisTier;
    lastLimit = tierLimit;
  }

  const maintenanceFee = tariffConfig.maintenance_percentage * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitation_percentage * baseWaterCharge;
  
  let vatAmount = 0;
  if (customerType === 'Domestic') {
    if (usageM3 > DOMESTIC_VAT_THRESHOLD) {
        vatAmount = waterChargeForVat * VAT_RATE;
    }
  } else {
    // For non-domestic, VAT is applied to the entire base water charge.
    vatAmount = baseWaterCharge * VAT_RATE;
  }

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
