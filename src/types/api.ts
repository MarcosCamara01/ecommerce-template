// API Request/Response types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface CartResponse {
  items: any[];
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
  variants: any[];
}

export interface AuthResponse {
  user: any;
  session: any;
  error?: string;
}

