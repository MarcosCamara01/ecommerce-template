import mongoose, { Document, model, Model, Schema } from 'mongoose';

export interface IProduct {
    name: string;
    description: string;
    price: number;
    category: string;
    colors: string[];
    sizes: string[];
    images: string[];
}

export interface IProductDocument extends Document, IProduct { }

const ProductSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
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
    colors: {
        type: [String],
        required: true,
    },
    sizes: {
        type: [String],
        required: true,
    },
    images: {
        type: [Buffer],
        required: true,
    },
});

export const Product = (mongoose.models.Product || model<IProductDocument>('Product', ProductSchema)) as Model<IProductDocument>;
