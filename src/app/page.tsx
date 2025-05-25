import { Suspense } from "react";
import { getAllProducts } from "./actions";
import { ErrorBoundary } from "react-error-boundary";
import ProductsSkeleton from "@/components/products/skeleton";
import { GridProducts } from "@/components/products/GridProducts";
import { ProductItem } from "@/components/products/item";

const Home = async () => {
  return (
    <section className="pt-14">
      <ErrorBoundary fallback={<ErrorComponent />}>
        <Suspense fallback={<ProductsSkeleton items={18} />}>
          <AllProducts />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
};

const ErrorComponent = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-xl font-bold">Oops! Something went wrong</h2>
      <p className="mt-2 text-gray-600">
        We couldn&apos;t load the products. Please try again later.
      </p>
    </div>
  );
};

const AllProducts = async () => {
  try {
    const products = await getAllProducts();

    if (!products || products.length === 0) {
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
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </GridProducts>
    );
  } catch (error) {
    console.error("Error loading products:", error);
    throw new Error("Error loading products");
  }
};

export default Home;
