import { SingleProduct } from "@/components/products/SingleProduct";
import { getProducts } from "@/helpers/getProducts"
import { Products } from "@/components/products/Products";

type Props = {
    params: {
        id: string;
    };
};

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function generateMetadata({ params }: Props) {
    const product = await getProducts(`?_id=${params.id}`);
    const capitalizedName = capitalizeFirstLetter(product.name); 

    return {
        title: `${capitalizedName} | Ecommerce Template`,
        description: product.description,   
    };
}

const ProductPage = async ({ params }: Props) => {
    const product = await getProducts(`?_id=${params.id}`);

    const randomProducts = await getProducts(`?random=${params.id}`);

    return (
        <section className="pt-14">
            <SingleProduct product={product} />

            <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">YOU MIGHT ALSO LIKE...</h2>

            <Products
                products={randomProducts}
                extraClassname={"colums-mobile"}
            />
        </section>
    );
};

export default ProductPage;