

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

// This interface now reflects the actual structure in the database
// where there is only one `tiers` column.
interface TariffInfo {
    customer_type: CustomerType;
    year: number;
    tiers: TariffTier[]; // The primary source for tier data
    maintenance_percentage: number;
    sanitation_percentage: number;
    sewerage_rate_per_m3: number;
    meter_rent_prices: { [key: string]: number; };
    vat_rate: number;
    domestic_vat_threshold_m3: number;
}


// This will be used for all Domestic calculations, overriding any database values.
const domesticTariffStructure: TariffInfo = {
    customer_type: 'Domestic',
    year: 0, // Year is irrelevant as this is a fixed override
    tiers: [
        { limit: 5, rate: 10.21 },
        { limit: 14, rate: 17.87 },
        { limit: 23, rate: 33.19 },
        { limit: 32, rate: 51.07 },
        { limit: 41, rate: 61.28 },
        { limit: 50, rate: 71.49 },
        // Add a safety tier for consumption above 50, using the last known rate.
        { limit: Infinity, rate: 71.49 },
    ],
    maintenance_percentage: 0.01,
    sanitation_percentage: 0.07,
    sewerage_rate_per_m3: 6.25,
    meter_rent_prices: {
        "0.5": 15.00,
        "0.75": 20.00,
        "1": 30.00,
        "1.25": 40.00,
        "1.5": 50.00,
        "2": 60.00,
        "2.5": 70.00,
        "3": 80.00,
        "4": 90.00,
        "5": 100.00,
        "6": 110.00
    },
    vat_rate: 0.15,
    domestic_vat_threshold_m3: 15,
};


const getLiveTariffInfo = async (type: CustomerType, year: number): Promise<TariffInfo | undefined> => {
    // Override for Domestic customers to use the hardcoded structure from the image
    if (type === 'Domestic') {
        return domesticTariffStructure;
    }

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
    
    // Helper to safely parse JSONB columns
    const parseJsonField = (field: any, fieldName: string) => {
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch { 
                console.error(`Failed to parse JSON for ${fieldName} for tariff ${type}/${year}`);
                return fieldName.includes('tiers') ? [] : {};
            }
        }
        // It's already an object/array if not a string
        return field || (fieldName.includes('tiers') ? [] : {});
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
  const tariffConfig = await getLiveTariffInfo(customerType, year);
  
  if (!tariffConfig) {
      console.warn(`Tariff information for customer type "${customerType}" for year ${year} not found. Bill calculation will be 0.`);
      return emptyResult;
  }
  
  let baseWaterCharge = 0;
  
  const tiers = (tariffConfig.tiers || []).sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
  if (tiers.length === 0) {
    console.warn(`Tiers for "${customerType}" for year ${year} are missing.`);
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

      baseWaterCharge += usageInThisTier * tierRate;
      remainingUsage -= usageInThisTier;
      lastLimit = tierLimit;
  }

  const maintenanceFee = tariffConfig.maintenance_percentage * baseWaterCharge;
  const sanitationFee = tariffConfig.sanitation_percentage * baseWaterCharge;
  
  let vatAmount = 0;
  if (customerType === 'Domestic' && usageM3 > tariffConfig.domestic_vat_threshold_m3) {
      let taxableWaterCharge = 0;
      let remainingTaxableUsage = usageM3 - tariffConfig.domestic_vat_threshold_m3;
      let lastTierLimitForVat = 0;
      
      for(const tier of tiers) {
        if(remainingTaxableUsage <= 0) break;

        const tierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);

        // Skip tiers that are fully within the exemption
        if (tierLimit <= tariffConfig.domestic_vat_threshold_m3) {
            lastTierLimitForVat = tierLimit;
            continue;
        }

        // The starting point for calculation in this tier
        const startPointInTier = Math.max(lastTierLimitForVat, tariffConfig.domestic_vat_threshold_m3);
        const usageInThisTierBlock = Math.min(tierLimit - startPointInTier, remainingTaxableUsage);

        if (usageInThisTierBlock > 0) {
             taxableWaterCharge += usageInThisTierBlock * tier.rate;
             remainingTaxableUsage -= usageInThisTierBlock;
        }
        
        lastTierLimitForVat = tierLimit;
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
