import { Schema, model, models } from "mongoose";

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  color: {
    type: String,
    required: true,
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
    ref: 'Product',
  },
});

export const Cart = models.Cart || model("Cart", CartSchema);