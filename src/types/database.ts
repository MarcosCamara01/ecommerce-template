// Supabase/Database types

export interface OrderItem {
  id: number;
  user_id: string;
  delivery_date: string;
  order_number: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerInfo {
  id: number;
  order_id: number;
  name: string;
  email: string;
  phone?: string;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  stripe_order_id: string;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface OrderProduct {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  size: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id?: number;
  user_id?: string;
  variant_id: number;
  stripe_id: string;
  quantity: number;
  size: string;
}

