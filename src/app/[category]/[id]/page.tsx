import { SingleProduct } from "@/components/product";
import { getProduct, getRandomProducts } from "@/app/actions";
import { Suspense } from "react";
import ProductsSkeleton from "@/components/products/skeleton";
import { SingleProductSkeleton } from "@/components/product/skeleton";
import { GridProducts } from "@/components/products/GridProducts";
import { ProductItem } from "@/components/products/item";

type Props = {
  params: {
    id: string;
  };
};

const capitalizeFirstLetter = (string?: string) => {
  if (!string) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export async function generateMetadata({ params }: Props) {
  const product = await getProduct(Number(params.id));
  const capitalizedName = capitalizeFirstLetter(product?.name);

  return {
    title: `${capitalizedName ?? "Loading..."} | Ecommerce Template`,
    description: product?.description ?? "Loading...",
  };
}

const ProductPage = ({ params }: Props) => (
  <section className="pt-14">
    <Suspense
      fallback={
        <div>
          <SingleProductSkeleton />
          <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">
            YOU MIGHT ALSO LIKE...
          </h2>
          <ProductsSkeleton extraClassname={"colums-mobile"} items={6} />
        </div>
      }
    >
      <AllProducts id={params.id} />
    </Suspense>
  </section>
);

const AllProducts = async ({ id }: { id: string }) => {
  const product = await getProduct(Number(id));
  const productJSON = JSON.stringify(product);

  const randomProducts = await getRandomProducts(Number(id));

  return (
    <>
      <SingleProduct product={productJSON} />

      <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">
        YOU MIGHT ALSO LIKE...
      </h2>

      <GridProducts className="grid-cols-auto-fill-110">
        {randomProducts.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </GridProducts>
    </>
  );
};

export default ProductPage;
