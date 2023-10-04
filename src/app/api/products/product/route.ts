import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/models/Products';
import { connectDB } from '@/libs/mongodb';

connectDB();

export async function GET(req: NextRequest) {
    const query = new URL(req.url).searchParams;
    const _id = query.get('key');

    try {
        const product = await Product.findOne({ _id });

        if (!product) {
            return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Failed to fetch product.', error);
        return NextResponse.json({ error: 'Failed to fetch product.' }, { status: 500 });
    }
}