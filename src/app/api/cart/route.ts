import { NextRequest, NextResponse } from 'next/server';
import { Cart } from '../../../models/Cart';
import { connectDB } from '../../../libs/mongodb';

connectDB();

export async function GET() {
    try {
        const cart = await Cart.find();
        return NextResponse.json(cart.reverse());
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
        const updatedCart = await Cart.findByIdAndUpdate(id, dataToUpdate, { new: true });

        return NextResponse.json(updatedCart);
    } catch (error) {
        console.error('Failed to update product.', error);
        return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, cart } = await req.json();
        const dataToSave = {
            userId: userId,
            cart: cart,
        };
        const savedCart = await Cart.create(dataToSave);
        return NextResponse.json({ _id: savedCart._id });
    } catch (error) {
        console.error('Failed to save product.', error);
        return NextResponse.json({ error: 'Failed to save product.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const query = new URL(req.url).searchParams;
    const id = query.get('id');
    try {
        const deletedCart = await Cart.findByIdAndDelete(id);
        return NextResponse.json(deletedCart);
    } catch (error) {
        console.error('Failed to remove product.', error);
        return NextResponse.json({ error: 'Failed to remove product.' }, { status: 500 });
    }
}
