import { Product } from '@/models/Products';
import { NextResponse } from 'next/server';
import { connectDB } from '@/libs/mongodb';

connectDB();

export const GET = async(req: Request, context: any) => {
    const { params } = context;
    const _id = params.id

    try {
        const product = await Product.findOne({ _id });
        return NextResponse.json(product);
    } catch (error) {
        console.error('Failed to fetch product.', error);
        return NextResponse.json({ error: 'Failed to fetch product.' }, { status: 500 });
    }
}
