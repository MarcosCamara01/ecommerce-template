import { NextRequest, NextResponse } from 'next/server';
import { Product, IProduct } from '../../../models/Products';
import { connectDB } from '../../../libs/mongodb';

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

export async function PUT(req: NextRequest) {
    const query = new URL(req.url).searchParams;
    const id = query.get('id');

    try {
        const dataToUpdate = await req.json();
        const updatedProduct = await Product.findByIdAndUpdate(id, dataToUpdate, { new: true });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Failed to update product.', error);
        return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const dataToSave = await req.json();
        const savedProduct = await Product.create(dataToSave);
        return NextResponse.json({ _id: savedProduct._id });
    } catch (error) {
        console.error('Failed to save product.', error);
        return NextResponse.json({ error: 'Failed to save product.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const query = new URL(req.url).searchParams;
    const id = query.get('id');
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        return NextResponse.json(deletedProduct);
    } catch (error) {
        console.error('Failed to remove product.', error);
        return NextResponse.json({ error: 'Failed to remove product.' }, { status: 500 });
    }
}
