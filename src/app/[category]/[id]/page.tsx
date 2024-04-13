import { SingleProduct } from "@/components/products/SingleProduct";
import { Products } from "@/components/products/Products";
import { getProduct, getRandomProducts } from "@/app/actions";
import { ProductDocument } from "@/types/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { Session } from "next-auth";
import { isMobileDevice } from "@/libs/responsive";
import { Suspense } from "react";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";
import SingleProductSkeleton from "@/components/skeletons/SingleProductSkeleton";

type Props = {
    params: {
        id: string;
    };
};

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function generateMetadata({ params }: Props) {
    const product: ProductDocument = await getProduct(params.id);
    const capitalizedName = capitalizeFirstLetter(product.name);

    return {
        title: `${capitalizedName} | Ecommerce Template`,
        description: product.description,
    };
}

const ProductPage = async ({ params }: Props) => {
    const isMobile = isMobileDevice();

    return (
        <section className="pt-14">
            <Suspense fallback={
                <div>
                    <SingleProductSkeleton isMobile={isMobile} />
                    <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">YOU MIGHT ALSO LIKE...</h2>
                    <ProductSkeleton
                        extraClassname={"colums-mobile"}
                        numberProducts={6}
                    />
                </div>
            }>
                <AllProducts id={params.id} isMobile={isMobile} />
            </Suspense>

        </section>
    );
};

const AllProducts = async ({ id, isMobile }: { id: string, isMobile: boolean }) => {
    const session: Session | null = await getServerSession(authOptions);
    const product: ProductDocument = await getProduct(id);
    const randomProducts = await getRandomProducts(id);
    const productJSON = JSON.stringify(product);

    return (
        <>
            <SingleProduct
                product={productJSON}
                isMobile={isMobile}
                session={session}
            />

            <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">YOU MIGHT ALSO LIKE...</h2>

            <Products
                products={randomProducts}
                extraClassname={"colums-mobile"}
            />
        </>
    )
}

export default ProductPage;