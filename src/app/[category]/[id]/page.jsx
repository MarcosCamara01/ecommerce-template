"use client"

import { useState, useEffect } from "react";
import { useProductContext } from "@/helpers/ProductContext";
import { useParams } from "next/navigation";
import { fetchProducts } from '@/helpers/fetchProducts';

const ProductPage = () => {
    const { products, setProducts } = useProductContext();
    const [product, setProduct] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        const fetchProduct = async () => {
            const productData = await products;

            if (productData.length === 0) {
                await fetchProducts(setProducts);
            }

            const foundProduct = productData.find(chat => chat._id === params.id);

            if (foundProduct) {
                setProduct(foundProduct);
            }
            
            setIsLoading(false);
        };

        fetchProduct();
    }, [params.id, products]);

    return (
        <section>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <h1>{product.name}</h1>
            )}
        </section>
    )
}

export default ProductPage;
