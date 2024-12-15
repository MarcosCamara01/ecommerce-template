import { Document, Schema } from "mongoose";

export enum ProductState {
    PUBLISHED = "published",
    ARCHIVED = "archived",
    DRAFT = "draft",
}

export interface EnrichedOrders {
    name: string;
    email: string;
    phone: string | null;
    address: AddressDocument;
    products: [EnrichedProducts];
    orderId: string;
    total_price: number;
    orderNumber: string;
    expectedDeliveryDate: Date;
    purchaseDate: string;
    _id: string;
}

export interface ProductFormInput {
    name: string;
    description: string[]; // Array of strings for descriptions
    price: number;
    category: string;
    sizes: string[]; // Array of strings for sizes
    image: string[]; // Array of strings for image URLs
    variants: VariantFormInput[]; // Array of variants
    quantity: number;
    productId: string; // Assuming this is a string for the form
    purchased: boolean;
    state: ProductState; // Assuming ProductState is defined elsewhere
}

export interface VariantFormInput {
    name: string;
    sku: string;
    stock: number;
    color: string;
    stripePriceId: string; // Assuming this is needed
    images: string[]; // Array of image URLs for the variant
}

export interface EnrichedProducts {
    name: string;
    category: string;
    image: [string];
    price: number;
    purchased: boolean;
    color: string;
    stock: number;
    size: string;
    quantity: number;
    productId: Schema.Types.ObjectId;
    _id: Schema.Types.ObjectId;
    variantId: string;
    stripePriceId: string;
}

export interface OrdersDocument extends Document {
    userId: string;
    orders: [OrderDocument];
}

export interface OrderDocument {
    name: string;
    email: string;
    phone: number;
    address: AddressDocument;
    products: [ProductsDocument];
    orderId: string;
    purchaseDate: Date;
    expectedDeliveryDate: Date;
    total_price: number;
    orderNumber: string;
    _id: Schema.Types.ObjectId;
}

export interface AddressDocument {
    city: string;
    country: string;
    line1: string;
    line2: string;
    postal_code: string;
    state: string;
}

export interface ProductsDocument {
    productId: Schema.Types.ObjectId;
    sku: string;
    image: string;
    color: string;
    size: string;
    quantity: number;
    _id: string;
}

export interface FavoritesDocument extends Document {
    userId: string;
    favorites: [Schema.Types.ObjectId];
}

export interface ItemDocument {
    productId: Schema.Types.ObjectId;
    color: string;
    size: string;
    quantity: number;
    variantId: string;
    price: number;
    stripePriceId: string;
}
export interface ProductDocument extends Document {
    name: string;
    description: [string];
    price: number;
    category: string;
    sizes: [string];
    image: [string];
    variants: [VariantsDocument];
    quantity: number;
    productId: Schema.Types.ObjectId;
    purchased: boolean;
    state: ProductState;
    createdAt: Date;
    updatedAt: Date;
}

export interface VariantsDocument {
    _id: string;
    name: string;
    sku: string;
    stock: number;
    color: string;
    stripePriceId: string;
    images: [string];
}
export interface UserDocument {
    email: string;
    password: string;
    name: string;
    phone: string;
    address: AddressDocument;
    image: string;
    _id: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}
