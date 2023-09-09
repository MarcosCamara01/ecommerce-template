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
        const { cart } = await req.json();
        const dataToUpdate = {
            cart: cart,
        };

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
    const cartItemId = query.get('cartItemId');
    const userId = query.get('userId');

    if (!cartItemId || !userId) {
        return NextResponse.json({ error: 'Missing cartItemId or userId in the request.' }, { status: 400 });
    }

    try {
        // Encuentra el carrito del usuario específico
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found.' }, { status: 404 });
        }

        // Filtra los elementos del carrito, excluyendo el producto con el cartItemId
        cart.cart = cart.cart.filter((item: any) => item._id.toString() !== cartItemId);

        await cart.save(); // Guarda el carrito actualizado

        return NextResponse.json(cart);
    } catch (error) {
        console.error('Failed to remove product from cart.', error);
        return NextResponse.json({ error: 'Failed to remove product from cart.' }, { status: 500 });
    }
}  