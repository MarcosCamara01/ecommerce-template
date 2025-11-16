/** FUNCTIONALITY */
import { colorMapping } from "@/helpers/colorMapping";
import { useRouter } from "next/navigation";
import { cn } from "@/libs/utils";
/** TYPES */
import {
  type ProductVariant,
  type ProductWithVariants,
} from "@/schemas/ecommerce";

interface ColorsProps {
  variants: ProductWithVariants["variants"];
  selectedVariantColor?: ProductVariant["color"];
}

export function Colors({ variants, selectedVariantColor }: ColorsProps) {
  const router = useRouter();

  const handleColorChange = (variant: ProductVariant) => {
    router.replace(`?variant=${variant.color}`);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid grid-cols-auto-fill-32 gap-2.5 mt-5">
      {variants.map((v) => (
        <button
          type="button"
          key={v.id}
          className={cn(
            "border border-solid border-border-primary w-8 h-8 flex justify-center relative rounded transition duration-150 ease hover:border-border-secondary",
            { "border-border-secondary": selectedVariantColor === v.color }
          )}
          style={{ backgroundColor: colorMapping[v.color.toLowerCase()] }}
          onClick={() => handleColorChange(v)}
          title={`Color ${v.color}`}
        >
          <span
            className={cn({
              "w-2.5 absolute bottom-selected h-px bg-white":
                selectedVariantColor === v.color,
            })}
          />
        </button>
      ))}
    </div>
  );
}
