import { getProducts } from "@/helpers/getProducts";
import { Products } from "../components/Products";

const Home = async () => {
  try {
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
  } catch (error) {
    console.error('Error fetching products:', error);
    return (
      <div>Error fetching products. Please try again later.</div>
    );
  }
}

export default Home;
