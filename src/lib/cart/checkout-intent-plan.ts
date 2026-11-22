export type CheckoutLine = Readonly<{
  cartItemId: number;
  variantId: number;
  size: string;
  quantity: number;
  priceId: string;
  unitAmount: number;
  currency: string;
}>;

export type OpenCheckoutIntent = Readonly<{
  id: string;
  checkoutSessionId: string | null;
  items: readonly CheckoutLine[];
  reusable: boolean;
}>;

export type CheckoutIntentPlan<Intent extends OpenCheckoutIntent> = Readonly<{
  reuse: Intent | null;
  supersededSessionIds: string[];
}>;

function selectionKey(lines: readonly CheckoutLine[]): string {
  return lines
    .map((line) =>
      [
        line.cartItemId,
        line.variantId,
        line.size,
        line.quantity,
        line.priceId,
        line.unitAmount,
        line.currency,
      ].join("|"),
    )
    .sort()
    .join("\n");
}

export function planCheckoutIntent<Intent extends OpenCheckoutIntent>(
  openNewestFirst: readonly Intent[],
  selection: readonly CheckoutLine[],
  staleIntentIds: ReadonlySet<string>,
): CheckoutIntentPlan<Intent> {
  const key = selectionKey(selection);
  const live = openNewestFirst.filter((intent) => !staleIntentIds.has(intent.id));
  const reuse =
    live.find(
      (intent) => intent.reusable && selectionKey(intent.items) === key,
    ) ?? null;
  const selectedLines = new Set(selection.map((line) => line.cartItemId));
  const supersededSessionIds = live.flatMap((intent) =>
    intent !== reuse &&
    intent.checkoutSessionId !== null &&
    intent.items.some((line) => selectedLines.has(line.cartItemId))
      ? [intent.checkoutSessionId]
      : [],
  );
  return { reuse, supersededSessionIds };
}
