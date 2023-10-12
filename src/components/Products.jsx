import "../styles/products.css";
import Link from "next/link";
import { ProductCartInfo, DeleteButton } from "./CartElements";
import { FavoriteButton } from "./ProductsElements";

export const Products = ({ products }) => {
  return (
    <div className="products-section">
      {products.map((product) => {
        return (
          <div className="product-card" key={product._id}>

            <Link
              href={`/${product?.category}/${product.quantity
                ? product.productId
                : product._id}`}
            >
              <img
                src={product?.image}
                alt={product?.name}
                className="product-img"
                loading="lazy"
              />
            </Link>
            <div className="product-information">
              <div className="name-button">
                <Link
                  href={`/${product?.category}/${product.quantity
                    ? product.productId
                    : product._id}`}
                >
                  <h2 className="product-name">
                    {product?.name}
                  </h2>
                </Link>
                {product.quantity ? (
                  product.purchased ? (
                    product.quantity > 1 &&
                    <span>{product.quantity}</span>
                  ) : (
                    <DeleteButton product={product} />
                  )
                ) : (
                  <FavoriteButton product={product} />
                )}
              </div>
              {
                !product.purchased &&
                <div className="product-price">
                  {product?.quantity
                    ? (product.price * product.quantity).toFixed(2)
                    : product.price}€
                </div>
              }

              {
                product.quantity !== undefined &&
                <ProductCartInfo product={product}
                />
              }
            </div>
          </div>
        );
      })}
    </div>
  );
};