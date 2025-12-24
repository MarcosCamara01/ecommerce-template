// Business logic types (view models)

export interface Order {
  id: number;
  userId: string;
  orderNumber: number;
  items: OrderLineItem[];
  customer: CustomerDetails;
  total: number;
  status: OrderStatus;
  deliveryDate: string;
  createdAt: string;
}

export interface OrderLineItem {
  productId: number;
  variantId: number;
  quantity: number;
  size: string;
  price: number;
  color: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone?: string;
  address: DomainAddress;
}

export interface DomainAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Cart {
  items: CartLineItem[];
  total: number;
  subtotal: number;
  tax: number;
}

export interface CartLineItem {
  productId: number;
  variantId: number;
  quantity: number;
  size: string;
  price: number;
  name: string;
  color: string;
}

export interface DomainProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  variants: DomainProductVariant[];
}

export interface DomainProductVariant {
  id: number;
  color: string;
  sizes: string[];
  images: string[];
}
