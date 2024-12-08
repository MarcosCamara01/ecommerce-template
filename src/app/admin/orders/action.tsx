"use server";

import { connectDB } from "@/libs/mongodb";
import { Orders } from "@/models/Orders";
import { Product } from "@/models/Products";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { 
  OrdersDocument, 
  OrderDocument, 
  ProductsDocument,
  VariantsDocument, 
} from "@/types/types";

connectDB();

export const getAllOrders = async () => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    console.log(session?.user)
    if (!session?.user.isAdmin) {
      throw new Error("Unauthorized access");
    }

    const allOrders: OrdersDocument[] = await Orders.find({}).lean();

    console.log(allOrders[0].orders[0].products[0])
    
    // Sort all orders by purchase date (newest first)
    const sortedOrders = allOrders.flatMap(userOrders => 
      userOrders.orders.map(order => ({
        ...order,
        userId: userOrders.userId
      }))
    ).sort((a: OrderDocument, b: OrderDocument) => {
      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    });

    return sortedOrders;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return null;
  }
};

export const getUserOrders = async (userId: string) => {
  try {
    const userOrders: OrdersDocument | null = await Orders.findOne({ userId });

    if (userOrders && userOrders.orders && userOrders.orders.length > 0) {
      userOrders.orders.sort((a: OrderDocument, b: OrderDocument) => {
        const dateA = new Date(a.purchaseDate.toString());
        const dateB = new Date(b.purchaseDate.toString());
        return dateB.getTime() - dateA.getTime();
      });
    }

    return userOrders;
  } catch (error) {
    console.error("Error getting orders:", error);
  }
};