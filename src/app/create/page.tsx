import React from 'react';
import ProductForm from '../../components/ProductForm';
import '../../styles/createproduct.css';

const CreateProduct = () => {
    return (
        <section className='create-product'>
            <h2 className='section-h2'>Create a New Product</h2>
            <ProductForm />
        </section>
    );
};

export default CreateProduct;