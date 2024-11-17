import { Suspense } from "react";
import { Products } from "../components/products/Products";
import { getAllProducts } from "./actions";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";
import { ErrorBoundary } from "react-error-boundary";

const Home = async () => {
  return (
    <section className="pt-14">
      <ErrorBoundary fallback={<ErrorComponent />}>
        <Suspense
          fallback={<ProductSkeleton extraClassname="" numberProducts={18} />}
        >
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

    return <Products products={products} extraClassname="" />;
  } catch (error) {
    throw new Error("Error loading products");
  }
};

export default Home;
