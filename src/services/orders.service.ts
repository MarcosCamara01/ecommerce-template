import { ordersRepository } from "@/lib/db/drizzle/repositories";
import type {
  OrderItem,
  OrderWithDetails,
  InsertOrderItem,
  InsertOrderProduct,
  InsertCustomerInfo,
} from "@/schemas";

export async function getUserOrders(
  userId: string
): Promise<OrderWithDetails[]> {
  try {
    return await ordersRepository.findByUserId(userId);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function getOrderById(
  orderId: number
): Promise<OrderWithDetails | null> {
  try {
    return await ordersRepository.findById(orderId);
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function getOrderByNumber(
  orderNumber: number
): Promise<OrderWithDetails | null> {
  try {
    return await ordersRepository.findByOrderNumber(orderNumber);
  } catch (error) {
    console.error("Error fetching order by number:", error);
    return null;
  }
}

export async function createOrder(
  userId: string,
  orderNumber: number
): Promise<OrderItem | null> {
  try {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    return await ordersRepository.create({
      userId,
      orderNumber,
      deliveryDate,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

export async function createCompleteOrder(
  orderData: InsertOrderItem,
  customerData: Omit<InsertCustomerInfo, "orderId">,
  products: Omit<InsertOrderProduct, "orderId">[]
): Promise<OrderWithDetails | null> {
  try {
    return await ordersRepository.createComplete(
      orderData,
      customerData,
      products
    );
  } catch (error) {
    console.error("Error creating complete order:", error);
    return null;
  }
}

export async function addCustomerInfoToOrder(
  orderId: number,
  customerData: Omit<InsertCustomerInfo, "orderId">
) {
  try {
    return await ordersRepository.addCustomerInfo(orderId, customerData);
  } catch (error) {
    console.error("Error adding customer info:", error);
    return null;
  }
}

export async function addProductsToOrder(
  orderId: number,
  products: Omit<InsertOrderProduct, "orderId">[]
) {
  try {
    return await ordersRepository.addProducts(orderId, products);
  } catch (error) {
    console.error("Error adding products to order:", error);
    return null;
  }
}

export async function getNextOrderNumber(): Promise<number> {
  try {
    return await ordersRepository.getNextOrderNumber();
  } catch (error) {
    console.error("Error getting next order number:", error);
    return Date.now();
  }
}
