import React from 'react';
import ProductForm from '../../components/products/ProductForm';
import { Session, getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { redirect } from 'next/navigation';

const CreateProduct = async () => {
    const session: Session | null = await getServerSession(authOptions);

    if (session?.user) {
        if (session.user.email === "marcospenelascamara@gmail.com") {
            return (
                <section className='w-full min-h-screen pt-10'>
                    <h2 className='text-xl font-semibold mb-7'>Create a New Product</h2>
                    <ProductForm />
                </section>
            );
        } else {
            redirect('/');
        }
    } else {
        redirect('/login');
    }
};

export default CreateProduct;