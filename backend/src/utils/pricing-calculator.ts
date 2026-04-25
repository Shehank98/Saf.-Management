import { Decimal } from '@prisma/client/runtime/library';

export function calculateDepositAmount(totalAmount: number, depositPercentage: number): number {
  return (totalAmount * depositPercentage) / 100;
}

export function calculateCommission(revenue: number, commissionRate: number): number {
  return (revenue * commissionRate) / 100;
}

export function calculateProfit(revenue: number, vendorCosts: number): number {
  return revenue - vendorCosts;
}

export function toNumber(value: Decimal | number | string): number {
  if (typeof value === 'number') return value;
  return parseFloat(value.toString());
}
