import { Products } from "../components/products/Products";
import { getAllProducts } from "./actions";

const Home = async () => {
  const products = await getAllProducts();

  return (
    <section className="pt-14">
      <Products
        products={products}
        extraClassname=""
      />
    </section>
  );
}

export default Home;
