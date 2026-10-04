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

import { HeroDeck } from "./HeroDeck";
import { RotationToggle } from "./RotationToggle";
import { useHeroRotation } from "./useHeroRotation";

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

// The entrance plays on the first load of the session and on every change of
// piece, never when the visitor comes back to the home page.
let entrancePlayed = false;

/**
 * Home: a hero that fits the first screen and works as a carousel. The word
 * rises letter by letter behind a deck of photos (the piece in front, the
 * next ones fanned out behind it) and the piece changes by itself until the
 * visitor takes over. Below: the pieces by colour, the section bands and a
 * "Goes with" rail.
 */
export function HomeShowcase({
  pieces,
  bands,
}: {
  pieces: HeroPiece[];
  bands: React.ReactNode;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const rotation = useHeroRotation(pieces.length, heroRef);
  const { index, moves } = rotation;
  const [firstLoad] = useState(() => !entrancePlayed);
  const [pickedSize, setPickedSize] = useState<ProductSize | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    entrancePlayed = true;
  }, []);

  const piece = pieces[index];
  const { product, variant } = piece;
  const size =
    pickedSize && variant.sizes.includes(pickedSize) ? pickedSize : variant.sizes[0];
  const productHref = `/${product.category}/${product.id}?variant=${encodeURIComponent(variant.color)}`;
  // The photo that flies to the bag is the card in front.
  const frontCard = () =>
    deckRef.current?.querySelector<HTMLElement>('[data-deck-slot="0"]') ?? null;

  const animate = firstLoad || moves > 0;
  const word = piece.word.toUpperCase().split("");
  const toggle = rotation.rotates ? (
    <RotationToggle
      playing={rotation.playing}
      stopped={rotation.stopped}
      cycle={moves}
      onToggle={rotation.toggle}
      className="size-11 lg:size-[52px]"
    />
  ) : null;

  return (
    <>
      {/* Desktop sizes come from --hero-u, 1px of the 880px canvas scaled to
          the height of the screen (see .hero in globals.css). */}
      <section
        ref={heroRef}
        aria-roledescription="carousel"
        aria-label="Featured pieces"
        {...rotation.hold}
        className="hero relative isolate -mx-4 overflow-x-clip px-4 pb-10 lg:-mx-8 lg:h-[var(--hero-h)] lg:px-8 lg:pb-0 lg:pt-6"
      >
        <div className="relative h-[470px] lg:static lg:h-auto">
          <p
            aria-label={piece.word}
            style={
              {
                "--word-m": piece.wordSize.mobile,
                "--word-d": piece.wordSize.desktop,
              } as React.CSSProperties
            }
            className="absolute inset-x-0 top-0 whitespace-nowrap text-center font-display text-[length:var(--word-m)] leading-[0.85] lg:static lg:text-[length:min(var(--word-d),calc(var(--hero-u)*316))] lg:leading-[0.82]"
          >
            <span key={moves} className="inline-flex overflow-hidden align-top">
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
          <HeroDeck
            ref={deckRef}
            pieces={pieces}
            step={rotation.step}
            settle={firstLoad}
            onShift={rotation.shift}
          />
        </div>

        {/* Piece details: under the photo on phones, bottom-left on desktop. */}
        <div
          data-hero-hold=""
          className="flex flex-col gap-3.5 lg:absolute lg:bottom-[calc(var(--hero-u)*48)] lg:left-8 lg:w-[min(340px,25vw)] lg:gap-[max(12px,calc(var(--hero-u)*18))]"
        >
          {/* Announced when the visitor changes piece, not while it rotates. */}
          <div
            data-hero-claim=""
            aria-live={rotation.playing ? "off" : "polite"}
            aria-atomic="true"
          >
            <div
              key={moves}
              className={cn(
                "flex items-end justify-between gap-3 lg:flex-col lg:items-start lg:gap-[max(12px,calc(var(--hero-u)*18))]",
                moves > 0 && "animate-fade-in",
              )}
            >
              <div className="flex flex-col gap-0.5 lg:gap-[max(12px,calc(var(--hero-u)*18))]">
                <span className="text-xs text-muted lg:text-13">
                  {piece.categoryLabel} · {variant.color}
                </span>
                <h2 className="font-display-75 text-[26px] leading-none lg:text-[length:max(28px,calc(var(--hero-u)*44))] lg:leading-[0.95] lg:[word-spacing:0.08em]">
                  <Link href={productHref}>{product.name}</Link>
                </h2>
              </div>
              <span className="whitespace-nowrap text-lg font-medium tabular-nums lg:text-[length:max(18px,calc(var(--hero-u)*22))]">
                {formatPriceFromEuros(product.price)}
              </span>
            </div>
          </div>

          {/* Phones: the pieces as colour dots. */}
          <div className="flex items-center gap-1 lg:hidden">
            {pieces.map((option, position) => (
              <button
                key={option.product.id}
                type="button"
                aria-label={`${option.variant.color} ${option.word}`}
                aria-pressed={position === index}
                onClick={() => rotation.show(position)}
                className="press grid size-11 place-items-center rounded-pill aria-pressed:shadow-[0_0_0_1.5px_var(--fg)]"
              >
                <span
                  className="size-7 rounded-pill shadow-[0_0_0_1px_var(--line)]"
                  style={{ background: swatchBackground(option.variant.color) }}
                />
              </button>
            ))}
            <span className="ml-auto text-xs">{pieces.length} colours</span>
            {toggle}
          </div>

          <div
            data-hero-claim=""
            className="hidden lg:block"
            style={{ width: variant.sizes.length * 54 - 6 }}
          >
            <SizePicker
              compact
              options={variant.sizes}
              available={variant.sizes}
              value={size}
              onChange={setPickedSize}
            />
          </div>
          <div data-hero-claim="" className="hidden lg:block">
            <AddToCart
              key={`${variant.id}-${size}`}
              product={product}
              selectedVariant={variant}
              size={size}
              flySource={frontCard}
              className="h-14 text-[15px]"
            />
          </div>
        </div>

        {/* Desktop: piece counter, rotation toggle and next. */}
        <div className="absolute bottom-[calc(var(--hero-u)*48)] right-8 hidden flex-col items-end gap-4 lg:flex">
          <span className="font-display text-[length:max(40px,calc(var(--hero-u)*64))] font-extrabold leading-none tabular-nums">
            {String(index + 1).padStart(2, "0")}
            <span className="opacity-60">/{String(pieces.length).padStart(2, "0")}</span>
          </span>
          <div className="flex items-center gap-2">
            {toggle}
            <button
              type="button"
              onClick={() => rotation.shift(1)}
              className="press flex h-[52px] items-center gap-2.5 rounded-pill border border-fg px-[22px] font-medium"
            >
              Next piece
              <ArrowRightIcon />
            </button>
          </div>
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
          <div data-hero-hold="" data-hero-claim="" className="flex gap-2">
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
                flySource={frontCard}
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
              onClick={() => rotation.show(position)}
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
