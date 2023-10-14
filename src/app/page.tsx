import { getProducts } from "@/helpers/getProducts";
import { Products } from "../components/Products";

const Home = async () => {
  let products = await getProducts();
  if (products) {
    products.reverse();
  }

  return (
    <section className="section-products">
      <Products
        products={products}
      />
    </section>
  );
}

export default Home;