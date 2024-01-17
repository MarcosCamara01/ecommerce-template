import { Products } from "@/components/products/Products";
import { getProducts } from "@/helpers/getProducts"

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

    let products = await getProducts(`?cat=${params.category}`);

    return (
        <section className="pt-14">
            <Products
                products={products}
                extraClassname=""
            />
        </section>
    );
};

export default CategoryPage;
