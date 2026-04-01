import { eq, desc, sql } from "drizzle-orm";
import { db } from "../connection";
import {
  orderItems,
  orderProducts,
  customerInfo,
  productsVariants,
  productsItems,
} from "../schema";
import type {
  OrderWithDetails,
  CreateOrderItemInput,
  InsertOrderProduct,
  InsertCustomerInfo,
} from "@/lib/db/drizzle/schema";

const ORDER_NUMBER_LOCK_NAMESPACE = 42_001;
const ORDER_NUMBER_LOCK_RESOURCE = 1;
const MAX_CREATE_COMPLETE_ATTEMPTS = 3;
const UNIQUE_VIOLATION_CODE = "23505";

export const ordersRepository = {
  async findByStripeSessionId(
    stripeSessionId: string,
  ): Promise<OrderWithDetails | null> {
    const customer = await db.query.customerInfo.findFirst({
      where: eq(customerInfo.stripeOrderId, stripeSessionId),
    });

    if (!customer) return null;

    return this.findById(customer.orderId);
  },

  async findByUserId(userId: string): Promise<OrderWithDetails[]> {
    const orders = await db.query.orderItems.findMany({
      where: eq(orderItems.userId, userId),
      with: ORDER_WITH_DETAILS,
      orderBy: [desc(orderItems.createdAt)],
    });
    return orders.map(transformOrderWithDetails);
  },

  async findById(id: number): Promise<OrderWithDetails | null> {
    const order = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, id),
      with: ORDER_WITH_DETAILS,
    });

    return order ? transformOrderWithDetails(order) : null;
  },

  async findByOrderNumber(
    orderNumber: number,
  ): Promise<OrderWithDetails | null> {
    const order = await db.query.orderItems.findFirst({
      where: eq(orderItems.orderNumber, orderNumber),
      with: ORDER_WITH_DETAILS,
    });

    return order ? transformOrderWithDetails(order) : null;
  },

  async createComplete(
    orderData: CreateOrderItemInput,
    customerData: Omit<InsertCustomerInfo, "orderId">,
    products: Omit<InsertOrderProduct, "orderId">[],
  ): Promise<OrderWithDetails | null> {
    const existingOrder = await this.findByStripeSessionId(
      customerData.stripeOrderId,
    );
    if (existingOrder) {
      return existingOrder;
    }

    for (let attempt = 0; attempt < MAX_CREATE_COMPLETE_ATTEMPTS; attempt += 1) {
      try {
        return await db.transaction(async (tx) => {
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
              userId: orderData.userId,
              deliveryDate: orderData.deliveryDate,
              orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
            })
            .returning();

          if (!newOrder) return null;

          await tx.insert(customerInfo).values({
            orderId: newOrder.id,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            stripeOrderId: customerData.stripeOrderId,
            totalPrice: customerData.totalPrice,
          });

          await tx.insert(orderProducts).values(
            products.map((product) => ({
              orderId: newOrder.id,
              variantId: product.variantId,
              quantity: product.quantity,
              size: product.size,
            })),
          );

          const createdOrder = await tx.query.orderItems.findFirst({
            where: eq(orderItems.id, newOrder.id),
            with: ORDER_WITH_DETAILS,
          });

          return createdOrder ? transformOrderWithDetails(createdOrder) : null;
        });
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }

        const concurrentOrder = await this.findByStripeSessionId(
          customerData.stripeOrderId,
        );
        if (concurrentOrder) {
          return concurrentOrder;
        }

        if (attempt === MAX_CREATE_COMPLETE_ATTEMPTS - 1) {
          throw error;
        }
      }
    }

    return null;
  },
};

function isUniqueViolation(
  error: unknown,
): error is {
  code: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION_CODE
  );
}

const ORDER_WITH_DETAILS = {
  customerInfo: true,
  orderProducts: {
    with: {
      variant: {
        with: {
          product: true,
        },
      },
    },
  },
} as const;

function transformOrderWithDetails(row: {
  id: number;
  userId: string;
  deliveryDate: Date;
  orderNumber: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  customerInfo: typeof customerInfo.$inferSelect | null;
  orderProducts: Array<{
    id: number;
    orderId: number;
    variantId: number;
    quantity: number;
    size: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    variant: typeof productsVariants.$inferSelect & {
      product: typeof productsItems.$inferSelect;
    };
  }>;
}): OrderWithDetails {
  return {
    id: row.id,
    userId: row.userId,
    deliveryDate: row.deliveryDate.toISOString(),
    orderNumber: row.orderNumber,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    customerInfo: row.customerInfo
      ? {
          id: row.customerInfo.id,
          orderId: row.customerInfo.orderId,
          name: row.customerInfo.name,
          email: row.customerInfo.email,
          phone: row.customerInfo.phone,
          address: row.customerInfo.address,
          stripeOrderId: row.customerInfo.stripeOrderId,
          totalPrice: row.customerInfo.totalPrice,
          createdAt:
            row.customerInfo.createdAt?.toISOString() ??
            new Date().toISOString(),
          updatedAt:
            row.customerInfo.updatedAt?.toISOString() ??
            new Date().toISOString(),
        }
      : {
          id: 0,
          orderId: row.id,
          name: "",
          email: "",
          phone: null,
          address: { line1: "", city: "", postal_code: "", country: "" },
          stripeOrderId: "",
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
    orderProducts: row.orderProducts.map((op) => ({
      id: op.id,
      orderId: op.orderId,
      variantId: op.variantId,
      quantity: op.quantity,
      size: op.size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
      createdAt: op.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: op.updatedAt?.toISOString() ?? new Date().toISOString(),
      variant: {
        id: op.variant.id,
        productId: op.variant.productId,
        stripeId: op.variant.stripeId,
        color: op.variant.color,
        sizes: op.variant.sizes,
        images: op.variant.images,
        createdAt:
          op.variant.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt:
          op.variant.updatedAt?.toISOString() ?? new Date().toISOString(),
        product: {
          id: op.variant.product.id,
          name: op.variant.product.name,
          description: op.variant.product.description,
          price: Number(op.variant.product.price),
          category: op.variant.product.category,
          img: op.variant.product.img,
          createdAt:
            op.variant.product.createdAt?.toISOString() ??
            new Date().toISOString(),
          updatedAt:
            op.variant.product.updatedAt?.toISOString() ??
            new Date().toISOString(),
        },
      },
    })),
  };
}
