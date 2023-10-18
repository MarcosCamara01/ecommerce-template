import '../styles/singleproduct.css';
import { ProductButtons } from "@/components/ProductsElements";
import { ProductImages } from "@/components/ProductImages";

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
                <ProductImages
                    images={allImages}
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