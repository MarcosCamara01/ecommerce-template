import { CartDocument, ItemDocument } from "@/types/types";
import { Schema, model, models } from "mongoose";

const CartItemSchema = new Schema<ItemDocument>({
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
  variantId: {
    type: String,
    required: false,
  },
});

const CartSchema = new Schema<CartDocument>({
  userId: {
    type: String,
    required: true,
  },
  cart: {
    type: [CartItemSchema],
    default: [],
  },
  favorites: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
});

export const Cart = models.Cart || model("Cart", CartSchema);