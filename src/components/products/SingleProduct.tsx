"use client";

import { ProductImages } from "@/components/products/ProductImages";
import { ProductDocument, VariantsDocument } from "@/types/types";
import AddToCart from "../cart/AddToCart";
import { Session } from "next-auth";
import { useEffect, useState } from "react";

interface SingleProduct {
    product: string;
    isMobile: boolean;
    session: Session | null
}

export const SingleProduct = ({ product, isMobile, session }: SingleProduct) => {
    const productPlainObject: ProductDocument = JSON.parse(product);
    const [selectedVariant, setSelectedVariant] = useState<VariantsDocument>();

    useEffect(() => {
        setSelectedVariant(productPlainObject.variants[0]);
    }, []);

    if (!product) {
        return <div>Produnct nort found</div>;
    }

    return (
        <div className="flex flex-wrap justify-between gap-8">
            <div className="grow-999 basis-0">
                <ProductImages
                    name={productPlainObject.name}
                    isMobile={isMobile}
                    imageNumber={productPlainObject.variants[0].images.length}
                    selectedVariant={selectedVariant}
                />
            </div>

            <div className="sticky flex items-center justify-center w-full h-full grow basis-600 top-8">
                <div className='w-full border border-solid rounded border-border-primary bg-background-secondary'>
                    <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary" >
                        <h1 className="text-base font-semibold">{productPlainObject.name}</h1>
                        <span className="text-base">{productPlainObject.price}€</span>
                        <p className="text-sm">{productPlainObject.description}</p>
                    </div>

                    <AddToCart
                        session={session}
                        product={productPlainObject}
                        selectedVariant={selectedVariant}
                        setSelectedVariant={setSelectedVariant}
                    />

                </div>
            </div>
        </div>
    );
};