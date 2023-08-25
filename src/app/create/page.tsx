import React from 'react';
import ProductForm from '../../components/ProductForm';
import '../../styles/createproduct.css';

const CreateProduct = () => {
    return (
        <div className='create-product'>
            <h1>Create a New Product</h1>
            <ProductForm />
        </div>
    );
};

export default CreateProduct;