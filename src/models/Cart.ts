import { Schema, model, models } from "mongoose";

const CartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  cart: {
    type: [Schema.Types.ObjectId],
    ref: 'Product',
  },
  favorites: {
    type: [Schema.Types.ObjectId],
    ref: 'Product',
  },
});

export const Cart = models.Cart || model("Cart", CartSchema);