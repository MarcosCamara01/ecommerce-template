import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/models/Products';
import { connectDB } from '@/libs/mongodb';

connectDB();

const shuffleArray = (array: any) => {
    let shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('cat');
    const random = searchParams.get('random');
    const _id = searchParams.get('_id');

    try {
        let products;

        if (category) {
            products = await Product.find({ category });
            products.reverse();
        } else if (_id) {
            products = await Product.findOne({ _id });
        } else if (random) {
            const allProducts = await Product.find();
            const shuffledProducts = shuffleArray(allProducts);
            products = shuffledProducts
                .filter((product: any) => product._id.toString() !== random)
                .slice(0, 6);
        } else {
            products = await Product.find();
            products.reverse();
        }
        
        return NextResponse.json(products);
    } catch (error) {
        console.error('Failed to fetch products.', error);
        return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        return NextResponse.json(deletedProduct);
    } catch (error) {
        console.error('Failed to remove product.', error);
        return NextResponse.json({ error: 'Failed to remove product.' }, { status: 500 });
    }
}
