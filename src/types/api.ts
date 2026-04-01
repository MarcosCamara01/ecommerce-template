// API Request/Response types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface CartResponse {
  items: unknown[];
  total: number;
  count: number;
}

export interface OrderResponse {
  id: number;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  variants: unknown[];
}

export interface AuthResponse {
  user: unknown;
  session: unknown;
  error?: string;
}

