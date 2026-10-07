// String and data formatters

const euroCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

export function formatPriceFromCents(price: number): string {
  return euroCurrencyFormatter.format(price / 100);
}

export function formatPriceFromEuros(price: number): string {
  return euroCurrencyFormatter.format(price);
}

export function formatPriceFromMinorUnits(
  amount: number,
  currency: string,
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  const fractionDigits =
    formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** fractionDigits);
}
