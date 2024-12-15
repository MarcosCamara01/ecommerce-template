import Link from "next/link";
import { Images } from "./Images";
import { EnrichedProducts } from "@/types/types";
import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";
import { Wishlists, getTotalWishlist } from "@/app/(carts)/wishlist/action";
import { Session, getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/libs/auth";
import { setTotalItems } from "@/app/(carts)/cart/action";

const WishlistButton = dynamic(() => import("../cart/WishlistButton"), {
    loading: () => <Skeleton className="w-5 h-5" />,
});

const DeleteButton = dynamic(() => import("../cart/DeleteButton"), {
    loading: () => <Skeleton className="w-5 h-5" />,
});

const ProductCartInfo = dynamic(() => import("../cart/ProductCartInfo"), {
    loading: () => <Skeleton className="w-24 h-8" />,
});

export const Products = async ({
    products,
    extraClassname = "",
}: {
    products: EnrichedProducts[];
    extraClassname: string;
}) => {
    // Correct product quantities if needed
    const correctedProducts = products.map(async (product) => {
        const { productId, size, variantId, quantity, stock } = product;

        // Check if quantity exceeds stock
        if (quantity > stock) {
            // Correct the quantity in the cart
            await setTotalItems(productId, size, variantId, stock);

            // Update the product's quantity for rendering
            return { ...product, quantity: stock };
        }

        // No correction needed, return the product as-is
        return product;
    });

    // Wait for all corrections to complete
    const updatedProducts = await Promise.all(correctedProducts);

    const session: Session | null = await getServerSession(authOptions);
    const hasMissingQuantity = updatedProducts.some(
        (product) => !product.quantity,
    );
    const wishlist =
        hasMissingQuantity && session?.user
            ? await getTotalWishlist()
            : undefined;

    const gridClassname = [
        "grid gap-x-3.5 gap-y-6 sm:gap-y-9",
        extraClassname === "colums-mobile" && "grid-cols-auto-fill-110",
        extraClassname === "cart-ord-mobile" && "grid-cols-1",
        "sm:grid-cols-auto-fill-250",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={gridClassname}>
            {updatedProducts.map((product, index) => {
                const {
                    _id,
                    category,
                    quantity,
                    stock,
                    variantId,
                    size,
                    productId,
                    image,
                    name,
                    price,
                    purchased,
                } = product;

                if (quantity > stock) {
                    correctedProducts;
                }

                const productLink = `/${category}/${quantity ? productId : _id}`;
                const containerClassname = [
                    "flex justify-between border border-solid border-border-primary rounded-md overflow-hidden",
                    extraClassname === "cart-ord-mobile"
                        ? "flex-row sm:flex-col"
                        : "flex-col",
                ]
                    .filter(Boolean)
                    .join(" ");
                const linkClassname =
                    extraClassname === "cart-ord-mobile"
                        ? "w-6/12 sm:w-full hover:scale-105 transition-all"
                        : "hover:scale-105 transition-all";
                const infoClassname = [
                    extraClassname === "cart-ord-mobile"
                        ? "w-6/12 sm:w-full"
                        : "",
                    "flex justify-between flex-col gap-2.5 p-3.5 bg-background-secondary z-10",
                ]
                    .filter(Boolean)
                    .join(" ");

                return (
                    <div className={containerClassname} key={index}>
                        <Link href={productLink} className={linkClassname}>
                            <Images
                                image={image}
                                name={name}
                                width={280}
                                height={425}
                                priority={index === 0}
                                sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
                            />
                        </Link>
                        <div className={infoClassname}>
                            <div className="flex justify-between w-full">
                                <Link href={productLink} className="w-10/12">
                                    <h2 className="text-sm font-semibold truncate">
                                        {name}
                                    </h2>
                                </Link>
                                {quantity ? (
                                    purchased ? (
                                        quantity > 1 && (
                                            <span className="text-sm">
                                                {quantity}
                                            </span>
                                        )
                                    ) : (
                                        <DeleteButton product={product} />
                                    )
                                ) : (
                                    <WishlistButton
                                        session={session}
                                        productId={JSON.stringify(_id)}
                                        wishlistString={JSON.stringify(
                                            wishlist,
                                        )}
                                    />
                                )}
                            </div>
                            {!purchased && (
                                <div>
                                    <div className="text-sm pr-2.5 border-r">
                                        {" "}
                                        {quantity
                                            ? (price * quantity).toFixed(2)
                                            : price}{" "}
                                        €
                                    </div>
                                    <div className="text-sm">
                                        Stock: {product.stock}
                                    </div>
                                </div>
                            )}
                            {quantity !== undefined && (
                                <ProductCartInfo product={product} />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
