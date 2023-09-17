"use client"

import React, { useState } from 'react';
import axios from 'axios';

const ProductForm = () => {
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: 0,
        category: '',
    });

    const [variants, setVariants] = useState([]); // Estado para las variantes
    const [variantImageUrls, setVariantImageUrls] = useState([]); // Estado para las imágenes de las variantes
    const [imageUrls, setImageUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // Función reutilizable para cargar imágenes
    const uploadImages = async (e, callback) => {
        try {
            setIsUploading(true);
            const files = e.target.files;
            const newImageUrls = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append("image", file);
                const response = await axios.post("/api/upload", formData);
                newImageUrls.push(response.data.url);
            }

            callback(newImageUrls);
            setIsUploading(false);

        } catch (error) {
            console.error('Failed to save the images.', error);
            setIsUploading(false);
        }
    };

    const handleImageChange = (e) => {
        uploadImages(e, (newImageUrls) => {
            setImageUrls([...imageUrls, ...newImageUrls]);
        });
    };

    const handleVariantImageChange = (e, index) => {
        uploadImages(e, (newImageUrls) => {
            const updatedVariants = [...variants];
            updatedVariants[index].image = newImageUrls;
            setVariants(updatedVariants);
        });
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleVariantChange = (e, index) => {
        const { name, value } = e.target;
        const updatedVariants = [...variants];
        updatedVariants[index][name] = value;
        setVariants(updatedVariants);
    };

    const addVariant = () => {
        setVariants([...variants, { priceId: '', color: '' }]);
        setVariantImageUrls([...variantImageUrls, []]); // Inicializar con un array vacío para las imágenes de la nueva variante
    };

    const removeVariant = (index) => {
        const updatedVariants = [...variants];
        updatedVariants.splice(index, 1);
        setVariants(updatedVariants);

        const updatedVariantImageUrls = [...variantImageUrls];
        updatedVariantImageUrls.splice(index, 1);
        setVariantImageUrls(updatedVariantImageUrls);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const sizesArray = productData.sizes.split(',');

            const dataToSubmit = {
                ...productData,
                sizes: sizesArray,
                variants: variants,
                variantImages: variantImageUrls, // Enviar las imágenes de las variantes al servidor
                images: imageUrls
            };

            const url = '/api/products';

            const response = await axios.post(url, dataToSubmit);

            if (response.data && response.data._id) {
                console.log(response)
                console.log('Product created successfully!');
            }
        } catch (error) {
            console.error('Failed to create product.', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className='input-bx'>
                <label>Name:</label>
                <input type="text" name="name" value={productData.name} onChange={handleInputChange} />
            </div>

            <div className='input-bx'>
                <label>Description:</label>
                <textarea name="description" value={productData.description} onChange={handleInputChange} />
            </div>

            <div className='input-bx'>
                <label>Price:</label>
                <input type="number" name="price" value={productData.price} onChange={handleInputChange} />
            </div>

            <div className='input-bx'>
                <label>Category:</label>
                <input type="text" name="category" value={productData.category} onChange={handleInputChange} />
            </div>

            {/* Agregar campos para las variantes */}
            {variants.map((variant, index) => (
                <div key={index}>
                    <div className='input-bx'>
                        <label>Color:</label>
                        <input
                            type="text"
                            name="color"
                            value={variant.color}
                            onChange={(e) => handleVariantChange(e, index)}
                        />
                    </div>
                    <div className='input-bx'>
                        <label>Price ID:</label>
                        <input
                            type="text"
                            name="priceId"
                            value={variant.priceId}
                            onChange={(e) => handleVariantChange(e, index)}
                        />
                    </div>
                    <div className='input-bx'>
                        <label>Variant Images:</label>
                        <input
                            type="file"
                            name="variantImages"
                            multiple
                            onChange={(e) => handleVariantImageChange(e, index)}
                            disabled={isUploading}
                        />
                    </div>
                    {variantImageUrls[index] && (
                        <div className="image-preview-container">
                            {variantImageUrls[index].map((url, imageIndex) => (
                                <img
                                    key={imageIndex}
                                    src={url}
                                    alt={`Variant Image ${imageIndex}`}
                                    className="image-preview"
                                />
                            ))}
                        </div>
                    )}
                    <button type="button" onClick={() => removeVariant(index)}>Remove Variant</button>
                </div>
            ))}

            <button type="button" onClick={addVariant}>Add Variant</button>

            <div className='input-bx'>
                <label>Sizes:</label>
                <input type="text" name="sizes" value={productData.sizes} onChange={handleInputChange} />
            </div>

            <div className='input-bx'>
                <label>Main Images:</label>
                <input type="file" name="images" multiple onChange={handleImageChange} disabled={isUploading} />
            </div>

            <div className="image-preview-container">
                {imageUrls.map((url, index) => (
                    <img
                        key={index}
                        src={url}
                        alt={`Main Image ${index}`}
                        className="image-preview"
                    />
                ))}
            </div>
            {isUploading && <p>Uploading images...</p>}
            <button type="submit" disabled={isUploading}>Create Product</button>
        </form>
    );
};

export default ProductForm;