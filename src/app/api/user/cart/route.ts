import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addToCartSchema,
  cartItemWithDetailsSchema,
  selectCartItemSchema,
  updateCartItemSchema,
} from "@/lib/db/drizzle/schema";
import { getUser } from "@/lib/auth/server";
import {
  addToCart,
  clearCart,
  getCart,
  getCartWithDetails,
  removeFromCart,
  updateCartItem,
} from "@/services/cart.service";

const deleteCartItemSchema = z.object({
  itemId: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ items: [] });

    const view = request.nextUrl.searchParams.get("view");
    const items =
      view === "details"
        ? cartItemWithDetailsSchema
            .array()
            .parse(await getCartWithDetails(user.id))
        : selectCartItemSchema.array().parse(await getCart(user.id));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error getting cart items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const parsed = addToCartSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart item", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await addToCart(user.id, parsed.data);
    if (!result) {
      return NextResponse.json({ error: "Cart item not created" }, { status: 500 });
    }

    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("Error adding/updating cart item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const parsed = updateCartItemSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await updateCartItem(
      user.id,
      parsed.data.id,
      parsed.data.quantity,
    );
    if (!result) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const parsed = deleteCartItemSchema.safeParse({
      itemId: req.nextUrl.searchParams.get("itemId") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart item id", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.itemId) {
      const deleted = await removeFromCart(user.id, parsed.data.itemId);
      if (!deleted) {
        return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
      }
    } else {
      await clearCart(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart item(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
