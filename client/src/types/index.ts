export interface CalculationParams {
  purchaseCurrency: string;
  sellingCurrency: string;
  qualityControlPercent: number;
  transportInsuranceCost: number;
  duty: number;
  exchangeRate: number;
  italyAccessoryCosts: number;
  tools: number;
  companyMultiplier: number;
  retailMultiplier: number;
  optimalMargin: number;
}

export interface SellingPriceCalculation {
  purchasePrice: number;
  qualityControlCost: number;
  priceWithQC: number;
  transportInsuranceCost: number;
  priceWithTransport: number;
  dutyCost: number;
  priceWithDuty: number;
  italyAccessoryCosts: number;
  landedCost: number;
  wholesalePrice: number;
  retailPrice: number;
  retailPriceRaw: number;
  purchaseCurrency: string;
  sellingCurrency: string;
  companyMargin: number;
  params: CalculationParams;
}

export interface PurchasePriceCalculation {
  retailPrice: number;
  retailPriceRaw: number;
  wholesalePrice: number;
  landedCost: number;
  italyAccessoryCosts: number;
  priceWithoutAccessories: number;
  dutyCost: number;
  priceWithoutDuty: number;
  transportInsuranceCost: number;
  priceWithoutTransport: number;
  qualityControlCost: number;
  purchasePrice: number;
  purchasePriceRaw: number;
  purchaseCurrency: string;
  sellingCurrency: string;
  companyMargin: number;
  params: CalculationParams;
}

export interface ExchangeRates {
  [currency: string]: number;
}

export const CURRENCIES = [
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "Dollaro USA", symbol: "$" },
  { code: "GBP", name: "Sterlina", symbol: "£" },
  { code: "JPY", name: "Yen Giapponese", symbol: "¥" },
  { code: "CHF", name: "Franco Svizzero", symbol: "CHF" },
  { code: "CAD", name: "Dollaro Canadese", symbol: "C$" },
  { code: "AUD", name: "Dollaro Australiano", symbol: "A$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export type CalculationMode = "purchase" | "selling";
