import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addToCartSchema,
  cartItemWithDetailsSchema,
  selectCartItemSchema,
  updateCartItemSchema,
} from "@/lib/db/drizzle/schema";
import { DataAccessError } from "@/lib/data-access";
import { IdentityError, requirePrincipalFromHeaders } from "@/lib/identity";
import {
  addToCart,
  clearCart,
  getCart,
  getCartWithDetails,
  removeFromCart,
  updateCartItem,
} from "@/services/cart.service";

const deleteSchema = z.object({
  itemId: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const details = request.nextUrl.searchParams.get("view") === "details";
    const items = details
      ? cartItemWithDetailsSchema.array().parse(await getCartWithDetails(principal))
      : selectCartItemSchema.array().parse(await getCart(principal));
    return NextResponse.json({ items });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const item = addToCartSchema.parse(await readJsonBody(request));
    return NextResponse.json({ item: await addToCart(principal, item) });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const input = updateCartItemSchema.parse(await readJsonBody(request));
    return NextResponse.json({
      item: await updateCartItem(principal, input.id, input.quantity),
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
    });
    if (input.itemId) {
      const removed = await removeFromCart(principal, input.itemId);
      if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    } else {
      await clearCart(principal);
    }
    return NextResponse.json({ success: true });
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
      { error: "Invalid cart payload", details: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof InvalidJsonBodyError) {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }
  console.error("Cart route failed", error);
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
