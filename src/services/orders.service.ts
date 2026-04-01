import { ordersRepository } from "@/lib/db/drizzle/repositories";
import type {
  OrderWithDetails,
  CreateOrderItemInput,
  InsertOrderProduct,
  InsertCustomerInfo,
} from "@/lib/db/drizzle/schema";

export async function getUserOrders(
  userId: string,
): Promise<OrderWithDetails[]> {
  try {
    return await ordersRepository.findByUserId(userId);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function getOrderById(
  orderId: number,
): Promise<OrderWithDetails | null> {
  try {
    return await ordersRepository.findById(orderId);
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function getOrderByNumber(
  orderNumber: number,
): Promise<OrderWithDetails | null> {
  try {
    return await ordersRepository.findByOrderNumber(orderNumber);
  } catch (error) {
    console.error("Error fetching order by number:", error);
    return null;
  }
}

export async function createCompleteOrder(
  orderData: CreateOrderItemInput,
  customerData: Omit<InsertCustomerInfo, "orderId">,
  products: Omit<InsertOrderProduct, "orderId">[],
): Promise<OrderWithDetails | null> {
  try {
    return await ordersRepository.createComplete(
      orderData,
      customerData,
      products,
    );
  } catch (error) {
    console.error("Error creating complete order:", error);
    return null;
  }
}
