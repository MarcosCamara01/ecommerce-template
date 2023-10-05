import { Products } from "@/components/Products";
import { getProducts } from "@/helpers/getProducts"
import { headers } from 'next/headers';

const CategoryPage = async () => {
    const headersList = headers();

    const pathname = headersList.get("x-invoke-path") || "";
    const cleanedPathname = pathname.startsWith("/") ? pathname.substring(1) : pathname;

    let products = await getProducts(`cat=${cleanedPathname}`);
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
