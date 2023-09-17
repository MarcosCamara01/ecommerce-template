import { Schema, model, models } from "mongoose";

const CartItemSchema = new Schema({
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

const CartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
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