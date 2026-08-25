import { Suspense } from "react";
import { getAllProducts } from "./actions";
import {
  ProductsSkeleton,
  GridProducts,
  ProductItem,
} from "@/components/products";

const Home = async () => {
  return (
    <section className="pt-14">
      <h1 className="sr-only">All products</h1>
      <Suspense fallback={<ProductsSkeleton items={18} />}>
        <AllProducts />
      </Suspense>
    </section>
  );
};

const AllProducts = async () => {
  const products = await getAllProducts();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold">No products available</h2>
        <p className="mt-2 text-gray-600">
          Check back later to see our products
        </p>
      </div>
    );
  }

  return (
    <GridProducts>
      {products.map((product, index) => (
        <ProductItem key={product.id} product={product} priority={index === 0} />
      ))}
    </GridProducts>
  );
};

export default Home;
