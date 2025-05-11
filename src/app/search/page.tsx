import { getAllProducts } from "../actions";
import { GridProducts } from "@/components/products/GridProducts";
import { ProductItem } from "@/components/products/item";
import type { EnrichedProduct } from "@/schemas/ecommerce";

interface SearchProps {
  searchParams: { [key: string]: string | undefined };
}

const normalizeText = (text: string): string => {
  return text
    .replace(/[-_]/g, "")
    .replace(/[^\w\s]/g, "")
    .toLowerCase();
};

const Search = async ({ searchParams }: SearchProps) => {
  const products = await getAllProducts();

  let filteredProducts: EnrichedProduct[] = [];

  if (products) {
    filteredProducts = products.filter((product) =>
      normalizeText(product.name).includes(normalizeText(searchParams.q || ""))
    );
  }

  return (
    <section className="pt-14">
      {filteredProducts.length > 0 ? (
        <GridProducts>
          {products.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </GridProducts>
      ) : (
        <h3 className="text-sm text-center">
          No products found for &quot;{searchParams.q}&quot;
        </h3>
      )}
    </section>
  );
};

export default Search;
