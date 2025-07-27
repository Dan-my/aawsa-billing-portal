

// src/lib/billing.ts
import { supabase } from '@/lib/supabase';
import type { TariffRow } from '@/lib/actions';


export const customerTypes = ["Domestic", "Non-domestic"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const sewerageConnections = ["Yes", "No"] as const;
export type SewerageConnection = (typeof sewerageConnections)[number];

export const paymentStatuses = ['Paid', 'Unpaid', 'Pending'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

interface TariffTier {
  rate: number;
  limit: number | typeof Infinity;
}

interface TariffInfo {
    customer_type: CustomerType;
    year: number;
    tiers: TariffTier[];
    tiers_progressive: TariffTier[];
    maintenance_percentage: number;
    sanitation_percentage: number;
    sewerage_rate_per_m3: number;
    meter_rent_prices: { [key: string]: number; };
    vat_rate: number;
    domestic_vat_threshold_m3: number;
}


const getLiveTariffInfo = async (type: CustomerType, year: number): Promise<TariffInfo | undefined> => {
    const { data, error } = await supabase
        .from('tariffs')
        .select('*')
        .eq('customer_type', type)
        .eq('year', year)
        .single();
        
    if (error || !data) {
        console.error(`Could not fetch live tariff for ${type}/${year}:`, error);
        return undefined;
    }

    const tariff: TariffRow = data;
    
    const parseJsonField = (field: any, fieldName: string) => {
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch { 
                console.error(`Failed to parse JSON for ${fieldName} for tariff ${type}/${year}`);
                return fieldName.includes('tiers') ? [] : {};
            }
        }
        return field || (fieldName.includes('tiers') ? [] : {});
    };

    return {
        customer_type: tariff.customer_type as CustomerType,
        year: tariff.year,
        tiers: parseJsonField(tariff.tiers, 'tiers'),
        tiers_progressive: parseJsonField(tariff.tiers_progressive, 'tiers_progressive'),
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
  const tariffConfig = await getLiveTariffInfo(customerType, year);
  
  if (!tariffConfig) {
      console.warn(`Tariff information for customer type "${customerType}" for year ${year} not found in database. Bill calculation will be 0.`);
      return emptyResult;
  }
  
  let baseWaterCharge = 0;
  let waterChargeForVat = 0;
  
  const VAT_RATE = tariffConfig.vat_rate;
  const DOMESTIC_VAT_THRESHOLD = tariffConfig.domestic_vat_threshold_m3;
  
  if (customerType === 'Domestic') {
      const tiers = (tariffConfig.tiers_progressive || []).sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
      if (tiers.length === 0) {
        console.warn(`Progressive tiers for "Domestic" for year ${year} are missing.`);
        return emptyResult;
      }

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

          if (lastLimit + usageInThisTier > DOMESTIC_VAT_THRESHOLD) {
              const vatApplicableUsageInTier = (lastLimit + usageInThisTier) - Math.max(lastLimit, DOMESTIC_VAT_THRESHOLD);
              waterChargeForVat += vatApplicableUsageInTier * tierRate;
          }

          remainingUsage -= usageInThisTier;
          lastLimit = tierLimit;
      }
  } else { // Non-domestic
      const tiers = (tariffConfig.tiers || []).sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
       if (tiers.length === 0) {
        console.warn(`Tiers for "Non-domestic" for year ${year} are missing.`);
        return emptyResult;
      }
      let applicableRate = 0;
      for (const tier of tiers) {
          if (usageM3 <= tier.limit) {
              applicableRate = tier.rate;
              break;
          }
      }
      baseWaterCharge = usageM3 * applicableRate;
  }

  const maintenanceFee = tariffConfig.maintenance_percentage * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitation_percentage * baseWaterCharge;
  
  let vatAmount = 0;
  if (customerType === 'Domestic') {
    if (usageM3 > DOMESTIC_VAT_THRESHOLD) {
        vatAmount = waterChargeForVat * VAT_RATE;
    }
  } else {
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
