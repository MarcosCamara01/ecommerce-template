import { z } from "zod";
import { ProductSizeEnum, ProductVariantWithProductSchema } from "./products";

export const OrderProductSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  variant_id: z.number(),
  quantity: z.number(),
  size: ProductSizeEnum,
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const CustomerInfoSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  stripe_order_id: z.string(),
  total_price: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const OrderItemSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  delivery_date: z.string(),
  order_number: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const OrderProductWithDetailsSchema = OrderProductSchema.extend({
  products_variants: ProductVariantWithProductSchema,
});

export const OrderWithDetailsSchema = OrderItemSchema.extend({
  order_products: z.array(OrderProductWithDetailsSchema),
  customer_info: CustomerInfoSchema,
});

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderProduct = z.infer<typeof OrderProductSchema>;
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;
export type OrderProductWithDetails = z.infer<typeof OrderProductWithDetailsSchema>;
export type OrderWithDetails = z.infer<typeof OrderWithDetailsSchema>;

