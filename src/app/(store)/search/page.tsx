import { getAllProducts } from "@/app/actions";
import { pickFirst, searchProducts } from "@/utils";
import { GridProducts, ProductItem } from "@/components/products";

interface SearchProps {
  searchParams: Promise<{ q: string | undefined }>;
}

const Search = async ({ searchParams }: SearchProps) => {
  const [products, params] = await Promise.all([
    getAllProducts(),
    searchParams,
  ]);

  const q = pickFirst(params, "q");

  const filteredProducts = searchProducts(products, q);

  return (
    <section className="pt-14">
      {filteredProducts.length > 0 ? (
        <GridProducts>
          {filteredProducts.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </GridProducts>
      ) : (
        <h3 className="text-sm text-center">
          No products found for &quot;{q}&quot;
        </h3>
      )}
    </section>
  );
};

export default Search;
