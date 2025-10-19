export const WISHLIST_QUERY_KEYS = {
  wishlistList: (userId: string) => [userId, "wishlist"] as const,
};
