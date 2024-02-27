"use client"

import React from 'react';
import ProductForm from '../../components/products/ProductForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/Loader';

const CreateProduct = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return <Loader />
    } else if (status === "authenticated") {
        if (session?.user?.email === "marcospenelascamara@gmail.com") {
            return (
                <section className='min-h-screen w-full pt-10'>
                    <h2 className='text-xl font-semibold mb-7'>Create a New Product</h2>
                    <ProductForm />
                </section>
            );
        } else {
            router.push('/');
            return null;
        }
    } else {
        router.push('/login')
        return null;
    }
};

export default CreateProduct;