import { SingleProduct } from "@/components/SingleProduct";
import { getProducts } from "@/helpers/getProducts"
import { headers } from 'next/headers';
import { Products } from "@/components/Products";

const ProductPage = async () => {
    const headersList = headers();

    const pathname = headersList.get("x-invoke-path") || "";
    const parts = pathname.split("/");
    const productId = parts.pop();

    const product = await getProducts(`_id=${productId}`);
    const randomProducts = await getProducts(`random=${productId}`);

    return (
        <section>
            <SingleProduct product={product} />

            <h2 className="random-section-h2">QUIZÁ TAMBIÉN TE GUSTE...</h2>

            <Products products={randomProducts} />
        </section>
    );
};

export default ProductPage;