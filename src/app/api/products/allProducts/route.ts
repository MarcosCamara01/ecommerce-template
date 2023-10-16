import { NextResponse } from 'next/server';
import { Product } from '@/models/Products';
import { connectDB } from '@/libs/mongodb';

connectDB();

export async function GET() {
    try {
        const products = await Product.find();

        return NextResponse.json(products.reverse());
    } catch (error) {
        console.error('Failed to fetch products.', error);
        return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
    }
}