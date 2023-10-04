import { getProducts } from "@/helpers/getProducts";
import { Products } from "../components/Products";

export default async function Home() {
  const products = await getProducts();

  return (
    <section className="section-products">
      <Products
        products={products}
      />
    </section>
  );
}