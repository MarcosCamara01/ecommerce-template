"use client"

import React from 'react';
import ProductForm from '../../components/ProductForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader } from '@/helpers/Loader';

import '../../styles/createproduct.css';

const CreateProduct = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return <Loader />
    } else if (status === "authenticated") {
        if (session?.user?.email === "marcospenelascamara@gmail.com") {
            return (
                <section className='create-product page-section'>
                    <h2 className='section-h2'>Create a New Product</h2>
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