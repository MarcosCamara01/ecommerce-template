import { NextRequest, NextResponse } from 'next/server';
import { Cart } from '../../../models/Cart';
import { connectDB } from '../../../libs/mongodb';

connectDB();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    try {
        const cart = await Cart.findOne({ userId });
        return NextResponse.json(cart);
    } catch (error) {
        console.error('Failed to fetch products.', error);
        return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    try {
        const { cart, favorites } = await req.json();
        let filter

        if (id) {
            filter = { _id: id };
        } else if (userId) {
            filter = { userId: userId };
        }

        const dataToUpdate = {
            cart: cart,
            favorites: favorites
        };

        const updatedCart = await Cart.findOneAndUpdate(filter, { $set: dataToUpdate }, { returnOriginal: false });
        return NextResponse.json(updatedCart);
    } catch (error) {
        console.error('Failed to update product.', error);
        return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, cart, favorites } = await req.json();
        const dataToSave = {
            userId: userId,
            cart: cart,
            favorites: favorites
        };
        const savedCart = await Cart.create(dataToSave);
        return NextResponse.json(savedCart);
    } catch (error) {
        console.error('Failed to save product.', error);
        return NextResponse.json({ error: 'Failed to save product.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get('cartItemId');
    const userId = searchParams.get('userId');

    if (!cartItemId || !userId) {
        return NextResponse.json({ error: 'Missing cartItemId or userId in the request.' }, { status: 400 });
    }

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found.' }, { status: 404 });
        }

        cart.cart = cart.cart.filter((item: any) => item._id.toString() !== cartItemId);

        await cart.save();

        return NextResponse.json(cart);
    } catch (error) {
        console.error('Failed to remove product from cart.', error);
        return NextResponse.json({ error: 'Failed to remove product from cart.' }, { status: 500 });
    }
}  