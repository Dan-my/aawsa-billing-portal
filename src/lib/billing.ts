
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
    maintenance_percentage: number;
    sanitation_percentage: number;
    sewerage_rate_per_m3: number;
    meter_rent_prices: { [key: string]: number; };
    vat_rate: number;
    domestic_vat_threshold_m3: number;
}

const mapTariffRowToInfo = (tariff: TariffRow): TariffInfo => {
    const parseJsonField = (field: any, fieldName: string) => {
        if (field === null || field === undefined) {
             return fieldName.includes('tiers') ? [] : {};
        }
        if (typeof field === 'object' && field !== null) {
            return field; // Already an object
        }
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch { 
                console.error(`Failed to parse JSON for ${fieldName} for tariff ${tariff.customer_type}/${tariff.year}`);
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


const getLiveTariffFromDB = async (type: CustomerType, year: number): Promise<TariffInfo | null> => {
    const { data, error } = await supabase
        .from('tariffs')
        .select('*')
        .eq('customer_type', type)
        .eq('year', year)
        .single();
        
    if (error || !data) {
        console.warn(`Could not fetch live tariff for ${type}/${year}. Error: ${error?.message}. Attempting to use most recent tariff as fallback.`);
        const { data: fallbackData, error: fallbackError } = await supabase
            .from('tariffs')
            .select('*')
            .eq('customer_type', type)
            .order('year', { ascending: false })
            .limit(1)
            .single();

        if (fallbackError || !fallbackData) {
            console.error(`Fallback failed: Could not fetch ANY tariff for ${type}.`, fallbackError);
            return null;
        }
        console.warn(`Using fallback tariff from year ${fallbackData.year} for calculations for year ${year}.`);
        return mapTariffRowToInfo(fallbackData);
    }

    return mapTariffRowToInfo(data);
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
      console.error(`Tariff information for customer type "${customerType}" for year ${year} not found. Bill calculation will be incorrect.`);
      return emptyResult;
  }
  
  const tiers = (tariffConfig.tiers || []).sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
  
  if (tiers.length === 0) {
    console.warn(`Tiers for "${customerType}" for year ${year} are missing.`);
    return emptyResult;
  }

  let baseWaterCharge = 0;

  if (customerType === 'Domestic') {
    // Progressive tiered calculation for Domestic
    let remainingUsage = usageM3;
    let lastLimit = 0;
    for (const tier of tiers) {
        if (remainingUsage <= 0) break;
        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        const tierRate = Number(tier.rate);
        const tierBlockSize = tierLimit - lastLimit;
        const usageInThisTier = Math.min(remainingUsage, tierBlockSize);
        baseWaterCharge += usageInThisTier * tierRate;
        remainingUsage -= usageInThisTier;
        lastLimit = tierLimit;
    }
  } else {
    // Corrected Slab-based calculation for Non-domestic
    let applicableRate = 0;
    // Find the single correct rate for the given usage.
    for (const tier of tiers) {
        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        if (usageM3 <= tierLimit) {
            applicableRate = Number(tier.rate);
            break; // Found the correct tier, exit the loop.
        }
    }
    // If usage exceeds all defined limits, the loop will finish, and the rate of the last tier (Infinity) will be used implicitly.
    // If the loop finishes and applicableRate is still 0 (only if usage is higher than the highest finite limit), use the last tier rate.
    if (applicableRate === 0 && tiers.length > 0) {
        applicableRate = Number(tiers[tiers.length - 1].rate);
    }
    
    if (applicableRate > 0) {
        baseWaterCharge = usageM3 * applicableRate;
    } else {
        console.error(`Could not determine an applicable rate for Non-domestic customer with usage ${usageM3} m³.`);
        return emptyResult;
    }
  }

  // --- Fee and Tax Calculations (Common for both types) ---
  const maintenanceFee = tariffConfig.maintenance_percentage * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitation_percentage * baseWaterCharge;
  
  let vatAmount = 0;
  if (customerType === 'Domestic' && usageM3 > tariffConfig.domestic_vat_threshold_m3) {
      let taxableWaterCharge = 0;
      let remainingUsageForVat = usageM3;
      let lastLimitForVat = 0;

      for (const tier of tiers) {
          if (remainingUsageForVat <= 0) break;
          
          const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
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
