"use client";

/** FUNCTIONALITY */
import { colorMapping } from "@/constants/colors";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
/** TYPES */
import type {
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";

interface ColorsProps {
  variants: ProductWithVariants["variants"];
  selectedVariantColor?: ProductVariant["color"];
  compact?: boolean;
}

export function Colors({
  variants,
  selectedVariantColor,
  compact = false,
}: ColorsProps) {
  const router = useRouter();

  const handleColorChange = (variant: ProductVariant) => {
    router.replace(`?variant=${variant.color}`);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={cn("grid gap-2", {
        "grid-cols-auto-fill-32 gap-2.5 mt-5": !compact,
        "grid-flow-col auto-cols-max gap-1.5": compact,
      })}
    >
      {variants.map((v) => (
        <button
          type="button"
          key={v.id}
          className={cn(
            "border border-solid border-border-primary flex justify-center relative rounded transition duration-150 ease hover:border-border-secondary",
            {
              "border-border-secondary": selectedVariantColor === v.color,
              "w-8 h-8": !compact,
              "w-6 h-6": compact,
            },
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
