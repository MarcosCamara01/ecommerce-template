"use client"
import React, { useState } from 'react';
import axios from 'axios';

const ProductForm = () => {

    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: 0,
        category: '',
        colors: [],
        sizes: [],
        images: [],
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const files = e.target.files;
        const imagesArray = [];
    
        for (const file of files) {
            imagesArray.push(file);
        }
    
        setProductData((prevData) => ({
            ...prevData,
            images: imagesArray,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const colorsArray = productData.colors.split(',');
            const sizesArray = productData.sizes.split(',');
            const imagesBufferArray = productData.images.map((imageData) => Buffer.from(imageData));

            const dataToSubmit = {
                ...productData,
                colors: colorsArray,
                sizes: sizesArray,
                images: imagesBufferArray,
            };

            const url = '/api/products';

            const response = await axios.post(url, dataToSubmit);

            if (response.data && response.data._id) {
                console.log('Product created successfully!');
            }
        } catch (error) {
            console.error('Failed to create product.', error);
        }
    };


    return (
        <form onSubmit={handleSubmit}>
            <label>Name:</label>
            <input type="text" name="name" value={productData.name} onChange={handleInputChange} />

            <label>Description:</label>
            <textarea name="description" value={productData.description} onChange={handleInputChange} />

            <label>Price:</label>
            <input type="number" name="price" value={productData.price} onChange={handleInputChange} />

            <label>Category:</label>
            <input type="text" name="category" value={productData.category} onChange={handleInputChange} />

            <label>Colors:</label>
            <input type="text" name="colors" value={productData.colors} onChange={handleInputChange} />

            <label>Sizes:</label>
            <input type="text" name="sizes" value={productData.sizes} onChange={handleInputChange} />

            <label>Images:</label>
            <input type="file" name="images" multiple onChange={handleImageChange} />

            <button type="submit">Create Product</button>
        </form>
    );
};

export default ProductForm;
