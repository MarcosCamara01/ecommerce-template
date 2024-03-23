import { Suspense } from "react";
import { Products } from "../components/products/Products";
import { getAllProducts } from "./actions";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";

const Home = async () => {
  const products = await getAllProducts();

  return (
    <section className="pt-14">
      <Suspense fallback={<ProductSkeleton extraClassname="" numberProducts={18} />}>
        <Products
          products={products}
          extraClassname=""
        />
      </Suspense>
    </section>
  );
}

export default Home;
