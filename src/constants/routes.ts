// Route constants

export const routes = {
  // Public routes
  home: "/",
  login: "/(auth)/login",
  register: "/(auth)/register",
  
  // Store routes
  products: "/(store)/products",
  search: "/(store)/search",
  category: (cat: string) => `/(store)/${cat}`,
  productDetail: (id: string | number) => `/(store)/[category]/${id}`,
  
  // User routes
  cart: "/(user)/cart",
  wishlist: "/(user)/wishlist",
  orders: "/(user)/orders",
  orderDetail: (id: string | number) => `/(user)/orders/${id}`,
  profile: "/(user)/profile",
  
  // Admin routes
  admin: "/admin",
  createProduct: "/admin/products/create",
  
  // API routes
  api: {
    auth: "/api/v1/auth",
    cart: "/api/v1/cart",
    wishlist: "/api/v1/wishlist",
    orders: "/api/v1/orders",
    products: "/api/v1/products",
    users: "/api/v1/users",
    search: "/api/v1/search",
    stripe: "/api/v1/stripe",
  },
};

export type Routes = typeof routes;

