import {
  calculateExpectedDeliveryDate,
  generateRandomOrderNumber,
} from "@/helpers/orderModel";
import {
  AddressDocument,
  OrderDocument,
  OrdersDocument,
  ProductsDocument,
} from "@/types/types";
import { Schema, model, models } from "mongoose";

const ProductsSchema = new Schema<ProductsDocument>({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: false,
  },
});

const AddressSchema = new Schema<AddressDocument>({
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  line1: {
    type: String,
    required: true,
  },
  line2: {
    type: String,
    required: false,
  },
  postal_code: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
});

const OrderSchema = new Schema<OrderDocument>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: false,
  },
  address: AddressSchema,
  products: {
    type: [ProductsSchema],
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  expectedDeliveryDate: {
    type: Date,
    default: calculateExpectedDeliveryDate,
  },
  total_price: {
    type: Number,
    required: true,
  },
  orderNumber: {
    type: String,
    default: generateRandomOrderNumber,
  },
});

const OrdersSchema = new Schema<OrdersDocument>({
  userId: {
    type: String,
    required: true,
  },
  orders: {
    type: [OrderSchema],
    default: [],
  },
});

export const Orders = models.Orders || model("Orders", OrdersSchema);
