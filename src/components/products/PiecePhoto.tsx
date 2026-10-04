"use client";

import Image from "next/image";

import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * A product photo that fills its tile and, while its card is pointed at or
 * focused, shows the piece's next photo instead: an opacity crossfade,
 * 150ms, nothing moves. Put `group/piece` on the link that holds it.
 *
 * The next photo only exists for pointers that can hover, so a touch
 * screen never downloads it.
 */
export function PiecePhoto({
  src,
  nextSrc,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  /** Usually the second photo of the variant: a closer look at the piece. */
  nextSrc?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  return (
    <>
      <Image fill src={src} alt={alt} priority={priority} sizes={sizes} className="object-cover" />
      {canHover && nextSrc && nextSrc !== src ? (
        <Image
          fill
          src={nextSrc}
          alt=""
          sizes={sizes}
          className="object-cover opacity-0 transition-opacity duration-150 ease-out group-hover/piece:opacity-100 group-focus-visible/piece:opacity-100"
        />
      ) : null}
    </>
  );
}
