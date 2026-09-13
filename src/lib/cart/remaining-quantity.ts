export function remainingCartQuantity(
  currentQuantity: number,
  purchasedQuantity: number,
): number | null {
  const remaining = currentQuantity - purchasedQuantity;
  return remaining > 0 ? remaining : null;
}
