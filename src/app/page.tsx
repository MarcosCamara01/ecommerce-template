import { Products } from "../components/Products";

const Home = async () => {
  let products = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products`)
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
    }

    products = await res.json();
    products.reverse();

  } catch (error) {
    console.error('Error fetching products:', error);
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
