import { Products } from "../components/products/Products";

const Home = async () => {
  let products = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
    }

    products = await res.json();

  } catch (error) {
    console.error('Error fetching products:', error);
  }

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
