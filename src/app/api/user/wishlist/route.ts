import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addToWishlistSchema,
  selectWishlistItemSchema,
  wishlistItemWithProductSchema,
} from "@/lib/db/drizzle/schema";
import { dataAccess } from "@/lib/data-access";
import { requirePrincipalFromHeaders } from "@/lib/identity";
import { readJsonBody, userRouteError } from "@/lib/http/user-route";

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
    const wishlist = dataAccess.forUser(principal).wishlist;
    const details = request.nextUrl.searchParams.get("view") === "details";
    const items = details
      ? wishlistItemWithProductSchema
          .array()
          .parse(await wishlist.listWithDetails())
      : selectWishlistItemSchema.array().parse(await wishlist.list());
    return NextResponse.json({ items });
  } catch (error) {
    return wishlistRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const wishlist = dataAccess.forUser(principal).wishlist;
    const input = addToWishlistSchema.parse(await readJsonBody(request));
    return NextResponse.json({
      item: await wishlist.add(input.productId),
    });
  } catch (error) {
    return wishlistRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const wishlist = dataAccess.forUser(principal).wishlist;
    const input = deleteSchema.parse({
      itemId: request.nextUrl.searchParams.get("itemId") ?? undefined,
      productId: request.nextUrl.searchParams.get("productId") ?? undefined,
    });
    const removed = input.itemId
      ? await wishlist.remove(input.itemId)
      : await wishlist.removeByProduct(input.productId!);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return wishlistRouteError(error);
  }
}

const wishlistRouteError = (error: unknown) =>
  userRouteError(error, {
    invalidPayloadMessage: "Invalid wishlist payload",
    logContext: "Wishlist",
  });
