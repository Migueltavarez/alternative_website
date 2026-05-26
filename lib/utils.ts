import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-500',
    past_due: 'text-yellow-500',
    canceled: 'text-red-500',
    incomplete: 'text-orange-500',
    trialing: 'text-blue-500',
    unpaid: 'text-red-500',
  };
  return colors[status] || 'text-gray-500';
}

export function getPlanBadgeColor(plan: string): string {
  const colors: Record<string, string> = {
    BASIC: 'bg-gray-500/20 text-gray-400',
    PRO: 'bg-purple-500/20 text-purple-400',
    PREMIUM: 'bg-amber-500/20 text-amber-400',
  };
  return colors[plan] || 'bg-gray-500/20 text-gray-400';
}
