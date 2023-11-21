import { ProductButtons } from "@/components/ProductsElements";
import { ProductImages } from "@/components/ProductImages";

export const SingleProduct = ({ product }) => {
    if (!product) {
        return <div>Producto no encontrado</div>;
    }

    return (
        <div className="flex flex-wrap justify-between gap-8">
            <div className="grow-999 basis-0">
                <ProductImages
                    name={product.name}
                />
            </div>

            <div className="h-full w-full grow basis-600 sticky top-8 flex items-center justify-center">
                <div className='w-full border border-solid border-border-primary rounded bg-background-secondary'>
                    <div className="p-5 border-b border-solid border-border-primary flex justify-between flex-col gap-3" >
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