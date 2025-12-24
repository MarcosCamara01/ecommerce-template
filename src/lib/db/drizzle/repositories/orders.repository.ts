import { eq, desc } from "drizzle-orm";
import { db } from "../connection";
import {
  orderItems,
  orderProducts,
  customerInfo,
  productsVariants,
  productsItems,
} from "../schema";
import type {
  OrderItem,
  OrderWithDetails,
  InsertOrderItem,
  InsertOrderProduct,
  InsertCustomerInfo,
} from "@/schemas";

export const ordersRepository = {
  async findByUserId(userId: string): Promise<OrderWithDetails[]> {
    const orders = await db.query.orderItems.findMany({
      where: eq(orderItems.userId, userId),
      with: {
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
      },
      orderBy: [desc(orderItems.createdAt)],
    });

    return orders.map(transformOrderWithDetails);
  },

  async findById(id: number): Promise<OrderWithDetails | null> {
    const order = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, id),
      with: {
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
      },
    });

    return order ? transformOrderWithDetails(order) : null;
  },

  async findByOrderNumber(orderNumber: number): Promise<OrderWithDetails | null> {
    const order = await db.query.orderItems.findFirst({
      where: eq(orderItems.orderNumber, orderNumber),
      with: {
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
      },
    });

    return order ? transformOrderWithDetails(order) : null;
  },

  async createComplete(
    orderData: InsertOrderItem,
    customerData: Omit<InsertCustomerInfo, "orderId">,
    products: Omit<InsertOrderProduct, "orderId">[]
  ): Promise<OrderWithDetails | null> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orderItems)
        .values({
          userId: orderData.userId,
          deliveryDate: orderData.deliveryDate,
          orderNumber: orderData.orderNumber,
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
        products.map((p) => ({
          orderId: newOrder.id,
          variantId: p.variantId,
          quantity: p.quantity,
          size: p.size,
        }))
      );

      return this.findById(newOrder.id);
    });
  },

  async create(data: InsertOrderItem): Promise<OrderItem | null> {
    const [result] = await db
      .insert(orderItems)
      .values({
        userId: data.userId,
        deliveryDate: data.deliveryDate,
        orderNumber: data.orderNumber,
      })
      .returning();

    return result ? transformOrderItem(result) : null;
  },

  async addCustomerInfo(orderId: number, data: Omit<InsertCustomerInfo, "orderId">) {
    const [result] = await db
      .insert(customerInfo)
      .values({
        orderId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        stripeOrderId: data.stripeOrderId,
        totalPrice: data.totalPrice,
      })
      .returning();

    return result;
  },

  async addProducts(orderId: number, products: Omit<InsertOrderProduct, "orderId">[]) {
    const result = await db
      .insert(orderProducts)
      .values(
        products.map((p) => ({
          orderId,
          variantId: p.variantId,
          quantity: p.quantity,
          size: p.size,
        }))
      )
      .returning();

    return result;
  },

  async getNextOrderNumber(): Promise<number> {
    const [result] = await db
      .select({ maxOrderNumber: orderItems.orderNumber })
      .from(orderItems)
      .orderBy(desc(orderItems.orderNumber))
      .limit(1);

    return (result?.maxOrderNumber ?? 0) + 1;
  },
};

function transformOrderItem(row: typeof orderItems.$inferSelect): OrderItem {
  return {
    id: row.id,
    userId: row.userId,
    deliveryDate: row.deliveryDate.toISOString(),
    orderNumber: row.orderNumber,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

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
          createdAt: row.customerInfo.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: row.customerInfo.updatedAt?.toISOString() ?? new Date().toISOString(),
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
        createdAt: op.variant.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: op.variant.updatedAt?.toISOString() ?? new Date().toISOString(),
        product: {
          id: op.variant.product.id,
          name: op.variant.product.name,
          description: op.variant.product.description,
          price: Number(op.variant.product.price),
          category: op.variant.product.category,
          img: op.variant.product.img,
          createdAt: op.variant.product.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: op.variant.product.updatedAt?.toISOString() ?? new Date().toISOString(),
        },
      },
    })),
  };
}
