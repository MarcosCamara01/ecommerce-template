import '../styles/singleproduct.css';
import { ProductButtons } from "@/components/ProductsElements";

export const SingleProduct = ({ product }) => {
    if (!product) {
        return <div>Producto no encontrado</div>;
    }

    const allImages = [];
    if (product.image) {
        allImages.push(...product.image);
    }

    if (product.variants) {
        const variantImages = product.variants
            .filter(variant => variant.images)
            .map(variant => variant.images)
            .flat();

        allImages.push(...variantImages);
    }

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