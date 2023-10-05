import { getProducts } from "@/helpers/getProducts";
import { Products } from "../components/Products";

export default async function Home() {
  let products = await getProducts();
  products.reverse();

  return (
    <section className="section-products">
      <Products
        products={products}
      />
    </section>
  );
}