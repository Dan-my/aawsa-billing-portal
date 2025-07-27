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

const getLiveTariffFromDB = async (type: CustomerType, year: number): Promise<TariffInfo | null> => {
    const { data, error } = await supabase
        .from('tariffs')
        .select('*')
        .eq('customer_type', type)
        .eq('year', year)
        .single();
        
    if (error || !data) {
        console.error(`Could not fetch live tariff for ${type}/${year}:`, error);
        return null;
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
  
  const tiers = (tariffConfig.tiers || []).sort((a, b) => (a.limit === Infinity ? 1 : b.limit === Infinity ? -1 : a.limit - b.limit));
  if (tiers.length === 0) {
    console.warn(`Tiers for "${customerType}" for year ${year} are missing.`);
    return emptyResult;
  }

  let baseWaterCharge = 0;
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
      let usageForVatCalc = usageM3;
      let lastTierLimitForVat = 0;

      for(const tier of tiers) {
        if (usageForVatCalc <= 0) break;
        
        const currentTierLimit = tier.limit === Infinity ? Infinity : Number(tier.limit);
        const usageInTier = Math.min(usageForVatCalc, currentTierLimit - lastTierLimitForVat);

        const taxableStartPoint = tariffConfig.domestic_vat_threshold_m3;
        
        // Calculate the overlap between the current tier's usage range and the taxable range
        const tierStart = lastTierLimitForVat;
        const tierEnd = lastTierLimitForVat + usageInTier;

        const taxableAmountInTier = Math.max(0, Math.min(tierEnd, taxableStartPoint + usageForVatCalc) - Math.max(tierStart, taxableStartPoint));
        
        if (taxableAmountInTier > 0) {
            taxableWaterCharge += taxableAmountInTier * tier.rate;
        }

        usageForVatCalc -= usageInTier;
        lastTierLimitForVat = currentTierLimit;
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
