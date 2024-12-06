import { Suspense } from "react";
import { Products } from "../components/products/Products";
import { getAllProducts } from "./actions";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";
import MainBanner from "@/components/common/MainBanner";
import ProductBanner from "@/components/products/ProductBanner";
import HowBanner from "@/components/products/HowBanner";

const Home = async () => {
  return (
    <section className="">
      <Suspense
        fallback={<ProductSkeleton extraClassname="" numberProducts={18} />}
      >
        <MainBanner/>
        {/* //Todo Later not important */}
        {/* <HowBanner/> */}
        <ProductBanner/>
        <AllProducts />
      </Suspense>
    </section>
  );
};

const AllProducts = async () => {
  const products = await getAllProducts();

  return <Products products={products} extraClassname="" />;
};

export default Home;
