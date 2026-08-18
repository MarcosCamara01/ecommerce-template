import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db, type DatabaseTransaction } from "../connection";
import {
  customerInfo,
  orderItems,
  orderProducts,
  productsItems,
  productsVariants,
} from "../schema";
import type {
  CreateOrderItemInput,
  InsertCustomerInfo,
  InsertOrderProduct,
  OrderWithDetails,
} from "@/lib/db/drizzle/schema";

const ORDER_NUMBER_LOCK_NAMESPACE = 42_001;
const ORDER_NUMBER_LOCK_RESOURCE = 1;

export type CompleteOrderInput = {
  order: CreateOrderItemInput;
  customer: Omit<InsertCustomerInfo, "orderId">;
  products: Omit<InsertOrderProduct, "orderId">[];
};

export const ordersRepository = {
  async findByStripeSessionId(stripeSessionId: string) {
    const customer = await db.query.customerInfo.findFirst({
      where: eq(customerInfo.stripeOrderId, stripeSessionId),
    });
    return customer ? this.findById(customer.orderId) : null;
  },

  async findByUserId(userId: string): Promise<OrderWithDetails[]> {
    const rows = await db.query.orderItems.findMany({
      where: eq(orderItems.userId, userId),
      with: ORDER_WITH_DETAILS,
      orderBy: [desc(orderItems.createdAt)],
    });
    return rows.map(transformOrderWithDetails);
  },

  async findById(id: number): Promise<OrderWithDetails | null> {
    const row = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, id),
      with: ORDER_WITH_DETAILS,
    });
    return row ? transformOrderWithDetails(row) : null;
  },

  async findByIdForUser(userId: string, id: number) {
    const row = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.id, id), eq(orderItems.userId, userId)),
      with: ORDER_WITH_DETAILS,
    });
    return row ? transformOrderWithDetails(row) : null;
  },

  async createComplete(input: CompleteOrderInput): Promise<OrderWithDetails> {
    const orderId = await db.transaction((tx) =>
      createCompleteOrderInTransaction(tx, input),
    );
    const order = await this.findById(orderId);
    if (!order) throw new Error("Created order could not be read back");
    return order;
  },
};

export async function createCompleteOrderInTransaction(
  tx: DatabaseTransaction,
  input: CompleteOrderInput,
): Promise<number> {
  const existing = await tx.query.customerInfo.findFirst({
    where: eq(customerInfo.stripeOrderId, input.customer.stripeOrderId),
  });
  if (existing) return existing.orderId;

  await tx.execute(
    sql`select pg_advisory_xact_lock(${ORDER_NUMBER_LOCK_NAMESPACE}, ${ORDER_NUMBER_LOCK_RESOURCE})`,
  );

  const [lastOrder] = await tx
    .select({ orderNumber: orderItems.orderNumber })
    .from(orderItems)
    .orderBy(desc(orderItems.orderNumber))
    .limit(1);

  const [newOrder] = await tx
    .insert(orderItems)
    .values({
      userId: input.order.userId,
      deliveryDate: input.order.deliveryDate,
      orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
    })
    .returning({ id: orderItems.id });
  if (!newOrder) throw new Error("Order insert returned no row");

  await tx.insert(customerInfo).values({
    ...input.customer,
    orderId: newOrder.id,
  });
  await tx.insert(orderProducts).values(
    input.products.map((product) => ({ ...product, orderId: newOrder.id })),
  );
  return newOrder.id;
}

const ORDER_WITH_DETAILS = {
  customerInfo: true,
  orderProducts: { with: { variant: { with: { product: true } } } },
} as const;

function transformOrderWithDetails(row: {
  id: number;
  userId: string;
  deliveryDate: Date;
  orderNumber: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  customerInfo: typeof customerInfo.$inferSelect | null;
  orderProducts: Array<
    typeof orderProducts.$inferSelect & {
      variant: typeof productsVariants.$inferSelect & {
        product: typeof productsItems.$inferSelect;
      };
    }
  >;
}): OrderWithDetails {
  if (!row.customerInfo) {
    throw new Error(`Order ${row.id} has no customer information`);
  }
  return {
    id: row.id,
    userId: row.userId,
    deliveryDate: row.deliveryDate.toISOString(),
    orderNumber: row.orderNumber,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    customerInfo: {
      ...row.customerInfo,
      createdAt: row.customerInfo.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: row.customerInfo.updatedAt?.toISOString() ?? new Date().toISOString(),
    },
    orderProducts: row.orderProducts.map((product) => ({
      ...product,
      size: product.size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
      createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() ?? new Date().toISOString(),
      variant: {
        ...product.variant,
        archivedAt: product.variant.archivedAt?.toISOString() ?? null,
        createdAt: product.variant.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: product.variant.updatedAt?.toISOString() ?? new Date().toISOString(),
        product: {
          ...product.variant.product,
          price: Number(product.variant.product.price),
          archivedAt:
            product.variant.product.archivedAt?.toISOString() ?? null,
          createdAt:
            product.variant.product.createdAt?.toISOString() ??
            new Date().toISOString(),
          updatedAt:
            product.variant.product.updatedAt?.toISOString() ??
            new Date().toISOString(),
        },
      },
    })),
  };
}
