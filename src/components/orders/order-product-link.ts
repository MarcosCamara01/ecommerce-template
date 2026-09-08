export function orderProductLink(input: {
  productId: number;
  category: string;
  productArchivedAt: Date | string | null;
  variantColor: string;
  variantArchivedAt: Date | string | null;
}): string | null {
  if (input.productArchivedAt || input.variantArchivedAt) return null;
  const query = new URLSearchParams({ variant: input.variantColor });
  return `/${input.category}/${input.productId}?${query.toString()}`;
}
