import { Products } from "@/components/products/Products";
import { getCategoryProducts } from "../actions";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";
import { Suspense } from "react";

type Props = {
    params: {
        category: string;
    };
};

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function generateMetadata({ params }: Props) {
    const capitalizedCategory = capitalizeFirstLetter(params.category);

    return {
        title: `${capitalizedCategory} | Ecommerce Template`,
        description: `${capitalizedCategory} category at e-commerce template made by Marcos Cámara`,
    };
}

const CategoryPage = async ({ params }: Props) => {

    const products = await getCategoryProducts(params.category);

    return (
        <section className="pt-14">
            <Suspense fallback={<ProductSkeleton extraClassname="" numberProducts={6} />}>
                <Products
                    products={products}
                    extraClassname=""
                />
            </Suspense>
        </section>
    );
};

export default CategoryPage;
