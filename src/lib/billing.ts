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
  // This logic now correctly handles a flat-rate based on tiers for BOTH domestic and non-domestic.
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


  // --- Service Fees Calculation (based on total water charge) ---
  const maintenanceFee = (tariffConfig.maintenance_percentage ?? 0) * baseWaterCharge;
  const sanitationFee = (tariffConfig.sanitation_percentage ?? 0) * baseWaterCharge;
  
  // --- VAT Calculation ---
  let vatAmount = 0;
  // Per requirement, Domestic VAT is only for consumption > 15 m³.
  if (customerType === 'Domestic') {
    if (usageM3 > 15) {
      vatAmount = baseWaterCharge * VAT_RATE; // Apply to the full base charge if over limit
    }
  } else { // Non-domestic always gets VAT
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
