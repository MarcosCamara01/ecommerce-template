import { SingleProduct } from "@/components/SingleProduct";
import { getProducts } from "@/helpers/getProducts"
import { Products } from "@/components/Products";

const ProductPage = async ({ params }: { params: { id: string } }) => {
    let product = [];

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/${params.id}`, {cache: "no-store"});
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
        }

        product = await res.json();

    } catch (error) {
        console.error('Error fetching products:', error);
    }

    const randomProducts = await getProducts(`?random=${params.id}`);

    return (
        <section>
            <SingleProduct product={product} />

            <h2 className="random-section-h2">YOU MIGHT ALSO LIKE...</h2>

            <Products
                products={randomProducts}
                extraClassname={"random-mobile"}
            />
        </section>
    );
};

export default ProductPage;