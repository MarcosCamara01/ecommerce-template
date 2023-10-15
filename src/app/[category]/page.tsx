import { Products } from "@/components/Products";
import { getProducts } from "@/helpers/getProducts"

const CategoryPage = async ({ params }: { params: { category: string } } ) => {

    let products = await getProducts(`?cat=${params.category}`);
    products.reverse()

    return (
        <section>
            <Products
                products={products}
            />
        </section>
    );
};

export default CategoryPage;
