
export type VoucherStatus = 'Active' | 'Used' | 'Expired' | 'Cancelled';
export type VoucherDiscountType = 'percentage' | 'fixed_amount';

export interface Voucher {
  id: string;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  expiryDate?: string | null; // ISO date string
  status: VoucherStatus;
  maxUses?: number | null;
  timesUsed?: number;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
