// src/app/admin/products/update/page.tsx
import React from 'react';
import ProductForm from '@/components/admin/ProductForm';

const UpdateProductPage: React.FC = () => {
    return (
        <div>
            <h1>Update Product</h1>
            <ProductForm />
        </div>
    );
};

export default UpdateProductPage;