import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addToCartSchema,
  cartItemWithDetailsSchema,
  selectCartItemSchema,
  updateCartItemSchema,
} from "@/lib/db/drizzle/schema";
import { dataAccess } from "@/lib/data-access";
import { requirePrincipalFromHeaders } from "@/lib/identity";
import { readJsonBody, userRouteError } from "@/lib/http/user-route";

const deleteSchema = z.object({
  itemId: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const cart = dataAccess.forUser(principal).cart;
    const details = request.nextUrl.searchParams.get("view") === "details";
    const items = details
      ? cartItemWithDetailsSchema.array().parse(await cart.listWithDetails())
      : selectCartItemSchema.array().parse(await cart.list());
    return NextResponse.json({ items });
  } catch (error) {
    return cartRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const cart = dataAccess.forUser(principal).cart;
    const item = addToCartSchema.parse(await readJsonBody(request));
    return NextResponse.json({ item: await cart.add(item) });
  } catch (error) {
    return cartRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const cart = dataAccess.forUser(principal).cart;
    const input = updateCartItemSchema.parse(await readJsonBody(request));
    return NextResponse.json({
      item: await cart.update(input.id, input.quantity),
    });
  } catch (error) {
    return cartRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const cart = dataAccess.forUser(principal).cart;
    const input = deleteSchema.parse({
      itemId: request.nextUrl.searchParams.get("itemId") ?? undefined,
    });
    if (input.itemId) {
      const removed = await cart.remove(input.itemId);
      if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    } else {
      await cart.clear();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return cartRouteError(error);
  }
}

const cartRouteError = (error: unknown) =>
  userRouteError(error, {
    invalidPayloadMessage: "Invalid cart payload",
    logContext: "Cart",
  });
