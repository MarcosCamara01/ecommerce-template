"use client";

import { useState, useTransition } from "react";
import { ProductDocument, VariantsDocument } from "@/types/types";
import { colorMapping } from "@/helpers/colorMapping";
import { addItem } from "@/app/(carts)/cart/action";
import { Loader } from "../common/Loader";
import { Session } from "next-auth";
import { toast } from "sonner";

interface AddToCart {
    product: ProductDocument;
    session: Session | null;
    selectedVariant: VariantsDocument | undefined;
    setSelectedVariant: (variant: VariantsDocument) => void;
}

export default function AddToCart({ product, session, selectedVariant, setSelectedVariant }: AddToCart) {
    const [selectedSize, setSelectedSize] = useState<string>('');
    let [isPending, startTransition] = useTransition();
    
    return (
        <>
            <div className='p-5'>
                <div className='grid grid-cols-4 gap-2.5 justify-center'>
                    {product.sizes.map((size: string, index: number) => (
                        <button
                            key={index}
                            className={`flex items-center justify-center border border-solid border-border-primary px-1 py-1.5 bg-black rounded 
                            transition duration-150 ease hover:border-border-secondary text-13 ${selectedSize === size ? 'bg-white text-black' : ''}`}
                            onClick={() => setSelectedSize(size)}
                        >
                            <span>{size}</span>
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-auto-fill-32 gap-2.5	mt-5">
                    {product.variants.map((variant: VariantsDocument, index: number) => (
                        <button
                            key={index}
                            className={`border border-solid border-border-primary w-8 h-8 flex justify-center relative rounded 
                            transition duration-150 ease hover:border-border-secondary ${selectedVariant === variant ? 'border-border-secondary' : ''}`}
                            style={{ backgroundColor: colorMapping[variant.color] }}
                            onClick={() => {
                                setSelectedVariant(variant);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title={`Color ${variant.color}`}
                        >
                            <span className={selectedVariant === variant ? 'w-2.5 absolute bottom-selected h-px	bg-white' : ''} />
                        </button>
                    ))}
                </div>
            </div>

            <div className='border-t border-solid border-border-primary'>
                <button
                    type="submit"
                    onClick={() => {
                        if (session && selectedVariant !== undefined) {
                            startTransition(() => addItem(
                                product.category,
                                product._id,
                                selectedSize,
                                selectedVariant.priceId,
                                product.price
                            ));
                        } else {
                            if (!session) {
                                toast.info("You must be registered to be able to add a product to the cart.");
                            } else {
                                toast.error("Unknown error");
                            }
                        }
                    }}
                    className='w-full p-2 transition duration-150 text-13 ease hover:bg-color-secondary'
                >
                    {isPending
                        ? <Loader height={20} width={20} />
                        : "Add To Cart"}
                </button>
            </div>
        </>
    );
}