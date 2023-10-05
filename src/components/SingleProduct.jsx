import '../styles/singleproduct.css';
import { ProductButtons } from "@/components/ProductsElements";

export const SingleProduct = ({ product }) => {
    const allImages = product.images.concat(
        product.variants.map((variant) => variant.image).flat()
    );

    return (
        <div className="product-bx">
            <div className="img-bx">
                <div className='bx-grid'>
                    {allImages.map((image, index) => (
                        <div key={index}>
                            <img
                                src={image}
                                alt={`${product.name} - Image ${index + 1}`}
                                className={`product-img`}
                            />
                        </div>
                    ))}
                </div>
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