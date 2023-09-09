"use client"

import { useState, useEffect } from "react";
import { useProductContext } from "@/helpers/ProductContext";
import { useParams } from "next/navigation";
import { SingleProduct } from "../../../components/SingleProduct";

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
                <SingleProduct
                    product={product}
                />
            )}
        </section>
    )
}

export default ProductPage;
