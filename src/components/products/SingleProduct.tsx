import { ProductButtons } from "@/components/products/ProductsElements";
import { ProductImages } from "@/components/products/ProductImages";
import { ProductDocument } from "@/types/types";
import { isMobileDevice } from "@/libs/responsive";

export const SingleProduct = ({ product }: {product: ProductDocument}) => {
    const isMobile = isMobileDevice();

    if (!product) {
        return <div>Producto no encontrado</div>;
    }

    return (
        <div className="flex flex-wrap justify-between gap-8">
            <div className="grow-999 basis-0">
                <ProductImages
                    name={product.name}
                    isMobile={isMobile}
                />
            </div>

            <div className="sticky flex items-center justify-center w-full h-full grow basis-600 top-8">
                <div className='w-full border border-solid rounded border-border-primary bg-background-secondary'>
                    <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary" >
                        <h1 className="text-base font-semibold">{product.name}</h1>
                        <span className="text-base">{product.price}€</span>
                        <p className="text-sm">{product.description}</p>
                    </div>

                    <ProductButtons
                        product={product}
                    />

                </div>
            </div>
        </div>
    );
};