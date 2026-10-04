"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AddToCart } from "@/components/cart/AddToCart";
import { ArrowRightIcon } from "@/components/icons";
import { SizePicker } from "@/components/product/SizePicker";
import { RailCard } from "@/components/products/RailCard";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { shopSections } from "@/constants/navigation";
import { swatchBackground } from "@/constants/colors";
import type {
  ProductSize,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { formatPriceFromEuros } from "@/utils/formatters";

export type HeroPiece = {
  product: ProductWithVariants;
  variant: ProductVariant;
  /** Display word, e.g. "Quarter-zip". */
  word: string;
  /** min(px, vw) sizes for the word on phones and desktop. */
  wordSize: { mobile: string; desktop: string };
  categoryLabel: string;
  /** Four pieces from other sections for the "Goes with" rail. */
  pairs: ProductWithVariants[];
};

const CATEGORY_SECTIONS = shopSections.filter((section) => section.key !== "new-in");

// The entrance plays on the first load of the session and when the visitor
// changes piece, never when they come back to the home page.
let entrancePlayed = false;

/**
 * Home: a hero word that rises letter by letter behind the piece's photo,
 * quick add, the pieces by colour, the section bands and a "Goes with" rail.
 */
export function HomeShowcase({
  pieces,
  bands,
}: {
  pieces: HeroPiece[];
  bands: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  // 0 = no entrance; every change of piece bumps it to replay.
  const [entrance, setEntrance] = useState(() => (entrancePlayed ? 0 : 1));
  const [pickedSize, setPickedSize] = useState<ProductSize | null>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    entrancePlayed = true;
  }, []);

  const piece = pieces[index];
  const { product, variant } = piece;
  const size =
    pickedSize && variant.sizes.includes(pickedSize) ? pickedSize : variant.sizes[0];
  const productHref = `/${product.category}/${product.id}?variant=${encodeURIComponent(variant.color)}`;

  const show = (next: number) => {
    if (next === index) return;
    setIndex(next);
    setEntrance((count) => count + 1);
  };

  const animate = entrance > 0;
  const word = piece.word.toUpperCase().split("");

  return (
    <>
      <section className="relative -mx-4 overflow-hidden px-4 pb-10 lg:-mx-8 lg:min-h-[880px] lg:px-8 lg:pt-6">
        <div className="relative h-[470px] lg:static lg:h-auto">
          <p
            aria-label={piece.word}
            style={
              {
                "--word-m": piece.wordSize.mobile,
                "--word-d": piece.wordSize.desktop,
              } as React.CSSProperties
            }
            className="absolute inset-x-0 top-0 whitespace-nowrap text-center font-display text-[length:var(--word-m)] leading-[0.85] lg:static lg:text-[length:var(--word-d)] lg:leading-[0.82]"
          >
            <span key={`${index}-${entrance}`} className="inline-flex overflow-hidden align-top">
              {word.map((letter, position) => (
                <span
                  key={position}
                  aria-hidden="true"
                  className={cn("inline-block whitespace-pre", animate && "animate-rise")}
                  style={{ animationDelay: `${position * 28}ms` }}
                >
                  {letter}
                </span>
              ))}
            </span>
          </p>
          <div
            ref={photoRef}
            className="absolute left-1/2 top-[70px] w-64 -translate-x-1/2 overflow-hidden rounded-photo bg-photo shadow-hero lg:top-[150px] lg:w-[min(440px,30vw)] lg:rounded-photo-lg"
          >
            <Link href={productHref} tabIndex={-1} aria-hidden="true">
              <Image
                key={`${index}-${entrance}`}
                src={variant.images[0] ?? product.img}
                alt=""
                width={440}
                height={660}
                priority
                sizes="(max-width: 1023px) 256px, 30vw"
                className={cn(
                  "aspect-[2/3] w-full object-cover",
                  animate && "animate-fade-scale [animation-delay:200ms]",
                )}
              />
            </Link>
          </div>
        </div>

        {/* Piece details: under the photo on phones, bottom-left on desktop. */}
        <div className="flex flex-col gap-3.5 lg:absolute lg:bottom-12 lg:left-8 lg:w-[min(340px,25vw)] lg:gap-[18px]">
          <div className="flex items-end justify-between gap-3 lg:flex-col lg:items-start lg:gap-[18px]">
            <div className="flex flex-col gap-0.5 lg:gap-[18px]">
              <span className="text-xs text-muted lg:text-13">
                {piece.categoryLabel} · {variant.color}
              </span>
              <h2 className="font-display-75 text-[26px] leading-none lg:text-[44px] lg:leading-[0.95] lg:[word-spacing:0.08em]">
                <Link href={productHref}>{product.name}</Link>
              </h2>
            </div>
            <span className="whitespace-nowrap text-lg font-medium tabular-nums lg:text-[22px]">
              {formatPriceFromEuros(product.price)}
            </span>
          </div>

          {/* Phones: the pieces as colour dots. */}
          <div className="flex items-center gap-1 lg:hidden">
            {pieces.map((option, position) => (
              <button
                key={option.product.id}
                type="button"
                aria-label={`${option.variant.color} ${option.word}`}
                aria-pressed={position === index}
                onClick={() => show(position)}
                className="press grid size-11 place-items-center rounded-pill aria-pressed:shadow-[0_0_0_1.5px_var(--fg)]"
              >
                <span
                  className="size-7 rounded-pill shadow-[0_0_0_1px_var(--line)]"
                  style={{ background: swatchBackground(option.variant.color) }}
                />
              </button>
            ))}
            <span className="ml-auto text-xs">{pieces.length} colours</span>
          </div>

          <div className="hidden lg:block" style={{ width: variant.sizes.length * 54 - 6 }}>
            <SizePicker
              compact
              options={variant.sizes}
              available={variant.sizes}
              value={size}
              onChange={setPickedSize}
            />
          </div>
          <div className="hidden lg:block">
            <AddToCart
              key={`${variant.id}-${size}`}
              product={product}
              selectedVariant={variant}
              size={size}
              flySource={() => photoRef.current}
              className="h-14 text-[15px]"
            />
          </div>
        </div>

        {/* Desktop: piece counter and next. */}
        <div className="absolute bottom-12 right-8 hidden flex-col items-end gap-4 lg:flex">
          <span className="font-display text-[64px] font-extrabold leading-none tabular-nums">
            {String(index + 1).padStart(2, "0")}
            <span className="opacity-60">/{String(pieces.length).padStart(2, "0")}</span>
          </span>
          <button
            type="button"
            onClick={() => show((index + 1) % pieces.length)}
            className="press flex h-[52px] items-center gap-2.5 rounded-pill border border-fg px-[22px] font-medium"
          >
            Next piece
            <ArrowRightIcon />
          </button>
        </div>

        {/* Phones: sections and quick add pinned under the hero. */}
        <div className="mt-8 flex flex-col gap-3 lg:hidden">
          <nav aria-label="Sections" className="grid grid-cols-3 gap-1.5">
            {CATEGORY_SECTIONS.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                className="grid h-11 place-items-center rounded-pill border border-line text-13"
              >
                {section.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            <label className="relative h-14 w-[72px] shrink-0">
              <span className="sr-only">Size</span>
              <NativeSelect
                variant="hero"
                value={size ?? ""}
                onChange={(event) => setPickedSize(event.target.value as ProductSize)}
              >
                {variant.sizes.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <div className="grow">
              <AddToCart
                key={`${variant.id}-${size}`}
                product={product}
                selectedVariant={variant}
                size={size}
                flySource={() => photoRef.current}
                className="h-14 text-[15px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 pb-20">
        <h2 className="text-13 text-muted">Shop by colour</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
          {pieces.map((option, position) => (
            <button
              key={option.product.id}
              type="button"
              aria-pressed={position === index}
              onClick={() => show(position)}
              className="press flex items-center gap-3.5 rounded-chip border border-line p-2 pr-4 text-left aria-pressed:border-fg aria-pressed:bg-card"
            >
              <Image
                src={option.variant.images[0] ?? option.product.img}
                alt=""
                width={56}
                height={72}
                sizes="56px"
                className="h-[72px] w-14 rounded-[14px] bg-photo object-cover"
              />
              <span className="flex grow flex-col">
                <span className="font-medium">{option.word}</span>
                <span className="text-13 text-muted">{option.variant.color}</span>
              </span>
              <span
                aria-hidden="true"
                className="size-[22px] shrink-0 rounded-pill shadow-[0_0_0_1px_var(--line)]"
                style={{ background: swatchBackground(option.variant.color) }}
              />
            </button>
          ))}
        </div>
      </section>

      {bands}

      {piece.pairs.length > 0 ? (
        <section className="flex flex-col gap-7 py-16 lg:py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[48px] leading-[0.9] lg:text-[min(96px,6.6vw)]">
              Goes with {piece.word}
            </h2>
            <span aria-hidden="true" className="text-sm text-muted lg:hidden">
              Swipe →
            </span>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] lg:gap-4 lg:overflow-visible lg:px-0">
            {piece.pairs.map((pair) => (
              <div key={pair.id} className="w-[70%] shrink-0 snap-start lg:w-auto">
                <RailCard product={pair} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
