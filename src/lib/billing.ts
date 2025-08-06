
// src/lib/billing.ts
import { supabase } from '@/lib/supabase';
import type { TariffRow } from '@/lib/actions';

export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const paymentStatuses = ['Paid', 'Unpaid', 'Pending'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export interface TariffTier {
  rate: number;
  limit: number | "Infinity";
}

export interface TariffInfo {
    customer_type: CustomerType;
    year: number;
    tiers: TariffTier[];
    maintenance_percentage: number;
    sanitation_percentage: number;
    sewerage_rate_per_m3: number;
    meter_rent_prices: { [key: string]: number; };
    vat_rate: number;
    domestic_vat_threshold_m3: number;
}

const getLiveTariffFromDB = async (type: CustomerType, year: number): Promise<TariffInfo | null> => {
    let { data, error } = await supabase
        .from('tariffs')
        .select('*')
        .eq('customer_type', type)
        .eq('year', year)
        .single();
    
    if (error || !data) {
        console.error(`Tariff for ${type}/${year} not found in the database. Bill calculation cannot proceed.`, error);
        return null;
    }

    const tariff: TariffRow = data;
    
    const parseJsonField = (field: any, fieldName: string) => {
        if (field === null || field === undefined) {
             return fieldName.includes('tiers') ? [] : {};
        }
        if (typeof field === 'object' && field !== null) {
            return field;
        }
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch (e) { 
                console.error(`Failed to parse JSON for ${fieldName} for tariff ${type}/${year}:`, e);
                return fieldName.includes('tiers') ? [] : {};
            }
        }
        return fieldName.includes('tiers') ? [] : {};
    };

    return {
        customer_type: tariff.customer_type as CustomerType,
        year: tariff.year,
        tiers: parseJsonField(tariff.tiers, 'tiers'),
        maintenance_percentage: tariff.maintenance_percentage,
        sanitation_percentage: tariff.sanitation_percentage,
        sewerage_rate_per_m3: tariff.sewerage_rate_per_m3,
        meter_rent_prices: parseJsonField(tariff.meter_rent_prices, 'meter_rent_prices'),
        vat_rate: tariff.vat_rate,
        domestic_vat_threshold_m3: tariff.domestic_vat_threshold_m3,
    };
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
  const tariffConfig = await getLiveTariffFromDB(customerType, year);
  
  if (!tariffConfig) {
      console.warn(`Tariff information for customer type "${customerType}" for year ${year} not found. Bill calculation will be 0.`);
      return emptyResult;
  }
  
  const sortedTiers = (tariffConfig.tiers || []).sort((a, b) => {
    const limitA = a.limit === "Infinity" ? Infinity : Number(a.limit);
    const limitB = b.limit === "Infinity" ? Infinity : Number(b.limit);
    return limitA - limitB;
  });

  if (sortedTiers.length === 0) {
    console.warn(`Tiers for "${customerType}" for year ${year} are missing.`);
    return emptyResult;
  }

  let baseWaterCharge = 0;
  
  if (customerType === 'Domestic') {
      let remainingUsage = usageM3;
      let lastLimit = 0;
      for (const tier of sortedTiers) {
          if (remainingUsage <= 0) break;
          const tierLimit = tier.limit === "Infinity" ? Infinity : Number(tier.limit);
          const tierRate = Number(tier.rate);
          const tierBlockSize = tierLimit - lastLimit;
          const usageInThisTier = Math.min(remainingUsage, tierBlockSize);
          baseWaterCharge += usageInThisTier * tierRate;
          remainingUsage -= usageInThisTier;
          lastLimit = tierLimit;
      }
  } else if (customerType === 'Non-domestic') {
      let applicableRate = 0;
      for (const tier of sortedTiers) {
          const tierLimit = tier.limit === "Infinity" ? Infinity : Number(tier.limit);
          if (usageM3 <= tierLimit) {
              applicableRate = Number(tier.rate);
              break;
          }
      }
      // If usage is higher than the highest defined limit (that is not infinity), use the rate of the last tier
      if (applicableRate === 0 && sortedTiers.length > 0) {
          applicableRate = Number(sortedTiers[sortedTiers.length - 1].rate);
      }
      baseWaterCharge = usageM3 * applicableRate;
  }

  const maintenanceFee = tariffConfig.maintenance_percentage * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitation_percentage * baseWaterCharge;
  
  let vatAmount = 0;
  if (customerType === 'Domestic' && usageM3 > tariffConfig.domestic_vat_threshold_m3) {
      let taxableWaterCharge = 0;
      let remainingUsageForVat = usageM3;
      let lastLimitForVat = 0;

      for (const tier of sortedTiers) {
          if (remainingUsageForVat <= 0) break;
          
          const tierLimit = tier.limit === "Infinity" ? Infinity : Number(tier.limit);
          const tierRate = Number(tier.rate);
          const tierBlockSize = tierLimit - lastLimitForVat;
          
          const usageInTier = Math.min(remainingUsageForVat, tierBlockSize);
          
          const consumptionStartInTier = lastLimitForVat;
          const consumptionEndInTier = lastLimitForVat + usageInTier;

          if (consumptionEndInTier > tariffConfig.domestic_vat_threshold_m3) {
              const taxableUsageInTier = consumptionEndInTier - Math.max(consumptionStartInTier, tariffConfig.domestic_vat_threshold_m3);
              taxableWaterCharge += taxableUsageInTier * tierRate;
          }
          remainingUsageForVat -= usageInTier;
          lastLimitForVat = tierLimit;
      }
      vatAmount = taxableWaterCharge * tariffConfig.vat_rate;
  } else if (customerType === 'Non-domestic') {
      vatAmount = baseWaterCharge * tariffConfig.vat_rate;
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
