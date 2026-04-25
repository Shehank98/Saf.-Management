import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'LKR'): string {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-LK', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}
