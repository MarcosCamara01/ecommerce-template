"use client";

import { useState, useCallback } from "react";
import {
    EnrichedProducts,
    ItemDocument,
    ProductDocument,
    VariantsDocument,
} from "@/types/types";
import { colorMapping } from "@/helpers/colorMapping";
import { addItem, getItems } from "@/app/(carts)/cart/action";
import { Loader } from "../common/Loader";
import { Session } from "next-auth";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddToCartProps {
    product: ProductDocument;
    session: Session | null;
    selectedVariant: VariantsDocument | undefined;
    setSelectedVariant: (variant: VariantsDocument) => void;
}

export default function AddToCart({
    product,
    session,
    selectedVariant,
    setSelectedVariant,
}: AddToCartProps) {
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0]);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const addItemToCart = async (): Promise<EnrichedProducts[] | undefined> => {
        await addItem(
            product.category,
            product._id,
            selectedSize,
            selectedVariant!.sku,
            product.price,
        );
        return await getItems(session!.user._id);
    };

    // Option to go directly to checkout
    // const processStripePayment = async (cartItems: EnrichedProducts[]) => {
    //     const lineItems = cartItems.map((cartItem: ItemDocument) => ({
    //         productId: cartItem.productId,
    //         quantity: cartItem.quantity,
    //         variantId: cartItem.variantId,
    //         size: cartItem.size,
    //         color: cartItem.color,
    //         stripePriceId: cartItem.stripePriceId,
    //     }));

    //     const { data } = await axios.post("/api/stripe/payment", {
    //         lineItems,
    //         userId: session!.user._id,
    //     });

    //     if (data.statusCode === 500) {
    //         toast.error(data.message);
    //         console.error(data.statusCode, data.message);
    //         return null;
    //     }

    //     return data.session.url;
    // };

    const handleAddToCart = useCallback(async () => {
        if (!session) {
            toast.info(
                "You must be registered to be able to add a product to the cart.",
            );
            return;
        }
        if (!selectedVariant?._id) {
            toast.info("You have to select a color to save the product.");
            return;
        }
        if (!selectedSize) {
            toast.info("You have to select a size to save the product.");
            return;
        }

        if (selectedVariant?.stock === 0) {
            toast.info(
                "Sorry, you can't add more of this item as it's out of stock.",
            );
            return;
        }

        // Setup for going directly to checkout
        setIsPending(true);
        try {
            const cartItems = await addItemToCart();
            //Processing stripe payment
            // if (cartItems && cartItems.length > 0) {
            //     const paymentUrl = await processStripePayment(cartItems);
            //     if (paymentUrl) {
            //         window.location.href = paymentUrl;
            //     }
            // }
        } catch (error) {
            console.error(error);
            toast.error(
                "An error occurred while processing your request. Please try again.",
            );
        } finally {
            setIsPending(false);
            // Redirecting to Cart
            router.push("/cart");
        }
    }, [session, selectedVariant, selectedSize, product]);

    return (
        <>
            <div className="p-5">
                <div className="grid grid-cols-4 gap-2.5 justify-center">
                    {product.sizes.map((size, index) => (
                        <button
                            key={index}
                            className={`flex items-center justify-center border border-solid border-border-primary px-1 py-1.5 bg-black rounded transition duration-150 ease hover:border-border-secondary text-13 ${
                                selectedSize === size
                                    ? "bg-white text-black"
                                    : ""
                            }`}
                            onClick={() => setSelectedSize(size)}
                        >
                            <span>{size}</span>
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-auto-fill-32 gap-2.5 mt-5">
                    {product.variants.map((variant, index) => {
                        const stock = variant.stock;
                        return (
                            <div className="relative" key={index}>
                                <button
                                    className={`border border-solid border-border-primary w-8 h-8 flex justify-center relative rounded transition duration-150 ease hover:border-border-secondary ${
                                        selectedVariant?.color === variant.color
                                            ? "border-border-secondary"
                                            : ""
                                    } ${stock === 0 ? "cursor-not-allowed " : ""}`}
                                    style={{
                                        backgroundColor:
                                            colorMapping[variant.color],
                                    }}
                                    onClick={() => {
                                        if (stock > 0) {
                                            setSelectedVariant(variant);
                                            window.scrollTo({
                                                top: 0,
                                                behavior: "smooth",
                                            });
                                        }
                                    }}
                                    title={
                                        stock === 0
                                            ? `Color ${variant.color} is out of stock`
                                            : `Color ${variant.color}`
                                    }
                                    disabled={stock === 0}
                                >
                                    <span
                                        className={
                                            selectedVariant?.color ===
                                            variant.color
                                                ? "w-2.5 absolute bottom-selected h-px bg-white"
                                                : ""
                                        }
                                    />
                                </button>
                                {stock === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs rounded"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-solid border-border-primary">
                <button
                    type="submit"
                    onClick={handleAddToCart}
                    className="w-full p-2 transition duration-150 text-13 ease hover:bg-color-secondary"
                >
                    {isPending ? (
                        <Loader height={20} width={20} />
                    ) : (
                        "Add To Cart"
                    )}
                </button>
            </div>
        </>
    );
}
