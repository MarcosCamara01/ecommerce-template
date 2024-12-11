import { ProductDocument, ProductState, VariantsDocument } from "@/types/types";
import mongoose, { model, Model, Schema } from "mongoose";

const VariantsSchema = new Schema<VariantsDocument>({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  stock: {
    type: Number, 
    required: true,
  },
  stripePriceId: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
});

const ProductSchema: Schema = new Schema<ProductDocument>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: [String],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  sizes: {
    type: [String],
    required: true,
  },
  image: {
    type: [String],
    required: true,
  },
  variants: {
    type: [VariantsSchema],
    required: true,
  },
  state: {
    type: String,
    enum: ProductState,
    default: ProductState.DRAFT
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
export const Product = (mongoose.models.Product ||
  model("Product", ProductSchema)) as Model<any>;
