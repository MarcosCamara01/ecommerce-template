import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/models/Products';
import { connectDB } from '@/libs/mongodb';

connectDB();

export async function GET(req: NextRequest) {
    const query = new URL(req.url).searchParams;
    const category = query.get('key');

    try {
        let products;

        if (category) {
            products = await Product.find({ category });
        } else {
            products = await Product.find();
        }

        return NextResponse.json(products.reverse());
    } catch (error) {
        console.error('Failed to fetch products.', error);
        return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
    }
}
