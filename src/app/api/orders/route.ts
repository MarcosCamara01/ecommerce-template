import { NextRequest, NextResponse } from 'next/server';
import { Orders } from '../../../models/Orders';
import { connectDB } from '../../../libs/mongodb';

connectDB();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    try {
        const order = await Orders.findOne({ userId });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Failed to fetch products.', error);
        return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    try {
        const { orders } = await req.json();

        const dataToUpdate = {
            orders: orders,
        };

        const updatedCart = await Orders.findByIdAndUpdate(id, dataToUpdate, { new: true });
        return NextResponse.json(updatedCart);
    } catch (error) {
        console.error('Failed to update product.', error);
        return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, order } = await req.json();
        
        const dataToSave = {
            userId: userId,
            orders: order,
        };
        const savedCart = await Orders.create(dataToSave);
        return NextResponse.json({ _id: savedCart._id });
    } catch (error) {
        console.error('Failed to save product.', error);
        return NextResponse.json({ error: 'Failed to save product.' }, { status: 500 });
    }
}