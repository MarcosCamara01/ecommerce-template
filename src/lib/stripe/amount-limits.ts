export const STRIPE_EUR_MIN_CHARGE_CENTS = 50;
export const STRIPE_EUR_MAX_CHARGE_CENTS = 99_999_999;

export function stripeEurChargeTotal(
  items: readonly { unitAmount: number; quantity: number }[],
): number | null {
  let total = 0;
  for (const item of items) {
    if (
      !Number.isSafeInteger(item.unitAmount) ||
      item.unitAmount <= 0 ||
      item.unitAmount > STRIPE_EUR_MAX_CHARGE_CENTS ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return null;
    }
    const lineTotal = item.unitAmount * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) return null;
    total += lineTotal;
    if (!Number.isSafeInteger(total) || total > STRIPE_EUR_MAX_CHARGE_CENTS) {
      return null;
    }
  }
  return total >= STRIPE_EUR_MIN_CHARGE_CENTS ? total : null;
}
