// Application configuration

export const config = {
  // App info
  appName: "Ecommerce Template",
  appDescription: "Modern ecommerce template built with Next.js",
  
  // API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    timeout: 30000,
  },

  // Auth
  auth: {
    sessionCookieName: "better-auth.session_token",
    redirectAfterLogin: "/",
    redirectAfterLogout: "/",
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Features
  features: {
    enableWishlist: true,
    enableReviews: false,
    enableCoupon: false,
    enableNotifications: false,
  },

  // Cache
  cache: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  },
};

export type Config = typeof config;

