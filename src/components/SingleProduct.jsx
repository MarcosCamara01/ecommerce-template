import { ProductButtons } from "@/components/ProductsElements";
import { ProductImages } from "@/components/ProductImages";

import '../styles/singleproduct.css';

export const SingleProduct = ({ product }) => {
    if (!product) {
        return <div>Producto no encontrado</div>;
    }

    return (
        <div className="product-bx">
            <div className="img-bx">
                <ProductImages
                    name={product.name}
                />
            </div>

            <div className="information-bx sticky">
                <div className='sections-bx'>
                    <div className="section section-top">
                        <h1>{product.name}</h1>
                        <span>{product.price}€</span>
                        <p>{product.description}</p>
                    </div>

                    <ProductButtons
                        product={product}
                    />

                </div>
            </div>
        </div>
    );
};