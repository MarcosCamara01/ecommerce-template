"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Products } from "@/components/Products";
import { useProductContext } from '@/hooks/ProductContext';

const CategoryPage = () => {
    const { products } = useProductContext();
    const [productsInCategory, setProductsInCategory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        const fetchProductsInCategory = async () => {
            try {
                const productData = await products;

                if (params.category) {
                    const productsOfCategory = productData.filter(prod =>
                        prod.category.trim() === params.category.trim()
                    );

                    setProductsInCategory(productsOfCategory);
                } else {
                    console.error('Category is undefined.');
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProductsInCategory();
    }, [params.category, products]);

    return (
        <section>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <Products
                    products={productsInCategory}
                />
            )}
        </section>
    );
};

export default CategoryPage;
