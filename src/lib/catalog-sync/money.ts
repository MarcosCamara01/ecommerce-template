import { STRIPE_EUR_MAX_CHARGE_CENTS } from "../stripe/amount-limits.ts";

const MAX_CATALOG_PRICE_CENTS = STRIPE_EUR_MAX_CHARGE_CENTS;
const CATALOG_PRICE_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

export function parseCatalogPriceCents(value: string): number | null {
  const match = CATALOG_PRICE_PATTERN.exec(value.trim());
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0") || "0");
  if (!Number.isSafeInteger(whole)) return null;
  const cents = whole * 100 + fraction;
  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    cents > MAX_CATALOG_PRICE_CENTS
  ) return null;
  return cents;
}

export function catalogPriceCentsFromStoredDecimal(value: string | number): number {
  const cents = parseCatalogPriceCents(String(value));
  if (cents === null) {
    throw new Error("Stored catalog price is not a valid positive cent amount");
  }
  return cents;
}

export function catalogPriceDecimalFromCents(cents: number): string {
  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    cents > MAX_CATALOG_PRICE_CENTS
  ) {
    throw new Error("Catalog price cents are outside the supported range");
  }

  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}
