// Orders business logic

import type { Order, OrderLineItem } from "@/types/domain";
import type { OrderItem, CustomerInfo, OrderProduct } from "@/schemas";

export function transformOrderToViewModel(
  order: OrderItem,
  products: OrderProduct[],
  customerInfo: CustomerInfo
): Order {
  return {
    id: order.id,
    userId: order.user_id,
    orderNumber: order.order_number,
    items: products.map((p) => ({
      productId: 0,
      variantId: p.variant_id,
      quantity: p.quantity,
      size: p.size,
      price: 0,
      color: "",
    })),
    customer: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: {
        line1: customerInfo.address.line1,
        line2: customerInfo.address.line2,
        city: customerInfo.address.city,
        postalCode: customerInfo.address.postal_code,
        country: customerInfo.address.country,
      },
    },
    total: customerInfo.total_price,
    status: "delivered",
    deliveryDate: order.delivery_date,
    createdAt: order.created_at,
  };
}

export function calculateOrderTotal(items: OrderLineItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function isOrderDelivered(deliveryDate: string): boolean {
  return new Date(deliveryDate) <= new Date();
}
