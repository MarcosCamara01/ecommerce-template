import { Suspense } from "react";
import { Products } from "../components/products/Products";
import { getAllProducts, getProduct } from "./actions";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";
import MainBanner from "@/components/common/MainBanner";
import ProductBanner from "@/components/products/ProductBanner";
import HowBanner from "@/components/products/HowBanner";
import ProductBanner2 from "@/components/products/ProductBanner2";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/libs/auth";
import { ProductDocument } from "@/types/types";
import { SingleProduct } from "@/components/products/SingleProduct";

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
        <ProductBanner2/>
        <SingleProductComponent />
      </Suspense>
    </section>
  );
};

// const AllProducts = async () => {
//   const products = await getAllProducts();

//   return <Products products={products} extraClassname="" />;
// };

const SingleProductComponent = async () => {
  const session: Session | null = await getServerSession(authOptions);
  const product: ProductDocument = await getProduct("6753222a5ab4f54aac80c903");
  const productJSON = JSON.stringify(product);

  return <SingleProduct product={productJSON} session={session}  />;
};

export default Home;
