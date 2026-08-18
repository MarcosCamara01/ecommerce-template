import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addToWishlistSchema,
  selectWishlistItemSchema,
  wishlistItemWithProductSchema,
} from "@/lib/db/drizzle/schema";
import { DataAccessError } from "@/lib/data-access";
import { IdentityError, requirePrincipalFromHeaders } from "@/lib/identity";
import {
  addToWishlist,
  getWishlist,
  getWishlistWithDetails,
  removeFromWishlist,
  removeFromWishlistByProduct,
} from "@/services/wishlist.service";

const deleteSchema = z
  .object({
    itemId: z.coerce.number().int().positive().optional(),
    productId: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => value.itemId || value.productId, {
    message: "An itemId or productId is required",
  });

export async function GET(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const details = request.nextUrl.searchParams.get("view") === "details";
    const items = details
      ? wishlistItemWithProductSchema
          .array()
          .parse(await getWishlistWithDetails(principal))
      : selectWishlistItemSchema.array().parse(await getWishlist(principal));
    return NextResponse.json({ items });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const input = addToWishlistSchema.parse(await readJsonBody(request));
    return NextResponse.json({
      item: await addToWishlist(principal, input.productId),
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const input = deleteSchema.parse({
      itemId: request.nextUrl.searchParams.get("itemId") ?? undefined,
      productId: request.nextUrl.searchParams.get("productId") ?? undefined,
    });
    const removed = input.itemId
      ? await removeFromWishlist(principal, input.itemId)
      : await removeFromWishlistByProduct(principal, input.productId!);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof IdentityError) {
    return NextResponse.json({ error: error.code }, { status: 401 });
  }
  if (error instanceof DataAccessError && error.code === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid wishlist payload", details: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof InvalidJsonBodyError) {
    return NextResponse.json(
      { error: "Invalid wishlist payload" },
      { status: 400 },
    );
  }
  console.error("Wishlist route failed", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

class InvalidJsonBodyError extends Error {}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new InvalidJsonBodyError();
    throw error;
  }
}
