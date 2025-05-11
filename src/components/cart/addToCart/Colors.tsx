import { colorMapping } from "@/helpers/colorMapping";
import { cn } from "@/libs/utils";
import { type ProductVariant, type EnrichedProduct } from "@/schemas/ecommerce";

interface ColorsProps {
  variants: EnrichedProduct["variants"];
  selectedVariantId: ProductVariant["id"];
  onVariantChange: (variant: ProductVariant) => void;
}

export const Colors = ({
  variants,
  selectedVariantId,
  onVariantChange,
}: ColorsProps) => {
  const handleColorChange = (variant: ProductVariant) => {
    onVariantChange(variant);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid grid-cols-auto-fill-32 gap-2.5 mt-5">
      {variants.map((variant) => (
        <button
          type="button"
          key={variant.id}
          className={cn(
            "border border-solid border-border-primary w-8 h-8 flex justify-center relative rounded transition duration-150 ease hover:border-border-secondary",
            {
              "border-border-secondary": selectedVariantId === variant.id,
            }
          )}
          style={{ backgroundColor: colorMapping[variant.color] }}
          onClick={() => handleColorChange(variant)}
          title={`Color ${variant.color}`}
        >
          <span
            className={cn({
              "w-2.5 absolute bottom-selected h-px bg-white":
                selectedVariantId === variant.id,
            })}
          />
        </button>
      ))}
    </div>
  );
};
