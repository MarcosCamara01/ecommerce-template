export type CheckoutCartState<Item> = Readonly<{
  cartItemId: number;
  active: boolean;
  item: Item | null;
}>;

/**
 * A hidden archived row must never turn a mixed persisted cart into a smaller
 * checkout. Any stale identity makes the complete selection unavailable.
 */
export function selectCheckoutCartItems<Item>(
  state: readonly CheckoutCartState<Item>[],
  requestedIds: readonly number[],
): Item[] | null {
  const requested = new Set(requestedIds);
  const selected = state.filter((row) => requested.has(row.cartItemId));
  if (
    selected.length !== requested.size ||
    selected.some((row) => !row.active || row.item === null)
  ) {
    return null;
  }

  return selected.map((row) => row.item as Item);
}
