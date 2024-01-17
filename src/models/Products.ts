import mongoose, { Document, model, Model, Schema } from 'mongoose';

export interface ProductDocument extends Document {
    name: string;
    description: string;
    price: number;
    category: string;
    sizes: [string];
    image: [string];
    variants: [VariantsDocument];
    quantity: number;
    productId: Schema.Types.ObjectId;
    purchased: boolean;
}

export interface VariantsDocument {
    priceId: string;
    color: string;
    images: [string];
}

const VariantsSchema = new Schema<VariantsDocument>({
    priceId: {
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
});
export const Product = (mongoose.models.Product || model('Product', ProductSchema)) as Model<any>;
