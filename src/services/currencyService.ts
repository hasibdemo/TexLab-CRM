import { CurrencyCode } from '../types';

// Simple fixed exchange rates relative to USD (Base Currency)
export const EXCHANGE_RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  AED: 0.272,
  CNY: 0.14,
  TRY: 0.029,
  INR: 0.012,
};

export const currencyService = {
  getBaseCurrency(): CurrencyCode {
    return 'USD';
  },

  getRates(): Record<CurrencyCode, number> {
    return EXCHANGE_RATES_TO_USD;
  },

  convertToUSD(amount: number, fromCurrency: CurrencyCode): number {
    const rate = EXCHANGE_RATES_TO_USD[fromCurrency] ?? 1.0;
    return amount * rate;
  },

  formatUSD(amount: number, compact: boolean = false): string {
    if (compact) {
      if (amount >= 1_000_000) {
        return `$${(amount / 1_000_000).toFixed(2)}M`;
      }
      if (amount >= 1_000) {
        return `$${(amount / 1_000).toFixed(1)}k`;
      }
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatAmount(amount: number, currency: CurrencyCode): string {
    const symbols: Record<CurrencyCode, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      AED: 'AED ',
      CNY: '¥',
      TRY: '₺',
      INR: '₹',
    };
    const symbol = symbols[currency] || '$';
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
    return `${symbol}${formatted}`;
  },
};
