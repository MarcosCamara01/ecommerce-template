import { SingleProduct } from "../../../components/SingleProduct";
import { RandomProducts } from "../../../components/RandomProducts";
import { getProducts } from "@/helpers/getProducts"
import { headers } from 'next/headers';

const ProductPage = async() => {

    const headersList = headers();

    const pathname = headersList.get("x-invoke-path") || "";
    const parts = pathname.split("/");
    const productId = parts.pop();

    const product = await getProducts(`_id=${productId}`);
    const products = await getProducts();

    return (
        <section>
            
            <SingleProduct 
                product={product}
            />

            <h2 className='random-section-h2'>QUIZÁ TAMBIÉN TE GUSTE...</h2>

            <RandomProducts
                products={products}
            />
            
        </section>
    )
}

export default ProductPage;
