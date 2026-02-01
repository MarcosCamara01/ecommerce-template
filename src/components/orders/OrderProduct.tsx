/** COMPONENTS */
import { ProductImage } from "../products/ProductImage";
import Link from "next/link";
/** TYPES */
import type {
  OrderProductWithDetails,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";

interface OrderProductProps {
  product: ProductWithVariants;
  size: OrderProductWithDetails["size"];
  quantity: OrderProductWithDetails["quantity"];
}

export const OrderProduct = ({
  product,
  size,
  quantity,
}: OrderProductProps) => {
  const { name, price, category, id, variants } = product;
  const variant = variants[0];

  const productLink = `/${category}/${id}?variant=${variant.color}`;

  return (
    <div className="flex flex-col justify-between border border-solid border-border-primary rounded-md overflow-hidden">
      <Link href={productLink} className="hover:scale-105 transition-all">
        <ProductImage
          image={variant.images[0]}
          name={name}
          width={280}
          height={425}
          sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
      </Link>
      <div className="flex justify-between flex-col gap-2.5 p-3.5 bg-background-secondary z-10">
        <div className="flex justify-between w-full">
          <Link href={productLink} className="w-10/12">
            <h2 className="text-sm font-semibold truncate">{name}</h2>
          </Link>
        </div>

        <div className="text-sm">{price.toFixed(2)} €</div>

        {/* Mobile: show size + color */}
        <div className="flex sm:hidden">
          <div className="text-sm pr-2.5 border-r">{size}</div>
          <div className="text-sm pl-2.5">{variant.color}</div>
        </div>

        {/* Desktop: match cart layout (quantity + size + color) */}
        <div className="items-center justify-between hidden sm:flex">
          <div
            className="flex bg-background-primary w-min"
            aria-label={`Quantity: ${quantity}`}
          >
            <span className="flex items-center justify-center min-w-8 h-8 px-2 text-sm border border-solid rounded border-border-primary">
              {quantity}
            </span>
          </div>
          <div className="flex">
            <div className="text-sm pr-2.5 border-r">{size}</div>
            <div className="text-sm pl-2.5">{variant.color}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
