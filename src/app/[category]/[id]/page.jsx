"use client"

import { useState, useEffect } from "react";
import { useProductContext } from "@/hooks/ProductContext";
import { useParams } from "next/navigation";
import { SingleProduct } from "../../../components/SingleProduct";
import { RandomProducts } from "../../../components/RandomProducts";

const ProductPage = () => {
    const { products } = useProductContext();
    const [product, setProduct] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        const fetchProduct = async () => {
            const productData = await products;

            const foundProduct = productData.find(chat => chat._id === params.id);

            if (foundProduct) {
                setProduct(foundProduct);
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [params.id, products]);

    return (
        <section>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <SingleProduct
                        product={product}
                    />

                    <h2 className='random-section-h2'>QUIZÁ TAMBIÉN TE GUSTE...</h2>

                    <RandomProducts
                        products={products}
                    />
                </>
            )}
        </section>
    )
}

export default ProductPage;
