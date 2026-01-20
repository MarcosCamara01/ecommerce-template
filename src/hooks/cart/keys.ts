export const CART_QUERY_KEYS = {
  cartList: (userId: string) => [userId, "cart"] as const,
};
