import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addToWishlistSchema,
  selectWishlistItemSchema,
  wishlistItemWithProductSchema,
} from "@/lib/db/drizzle/schema";
import { getUser } from "@/lib/auth/server";
import {
  addToWishlist,
  getWishlist,
  getWishlistWithDetails,
  removeFromWishlist,
  removeFromWishlistByProduct,
} from "@/services/wishlist.service";

const deleteWishlistItemSchema = z
  .object({
    itemId: z.coerce.number().int().positive().optional(),
    productId: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => value.itemId || value.productId, {
    message: "An itemId or productId is required",
  });

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ items: [] });

    const view = request.nextUrl.searchParams.get("view");
    const items =
      view === "details"
        ? wishlistItemWithProductSchema
            .array()
            .parse(await getWishlistWithDetails(user.id))
        : selectWishlistItemSchema.array().parse(await getWishlist(user.id));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error getting wishlist items:", error);
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

    const parsed = addToWishlistSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid wishlist item", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const item = await addToWishlist(user.id, parsed.data.productId);

    if (!item) {
      const items = await getWishlist(user.id);
      const existingItem = items.find(
        (wishlistItem) => wishlistItem.productId === parsed.data.productId,
      );
      return NextResponse.json({ item: existingItem });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const parsed = deleteWishlistItemSchema.safeParse({
      itemId: req.nextUrl.searchParams.get("itemId") ?? undefined,
      productId: req.nextUrl.searchParams.get("productId") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid wishlist identifier", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const deleted = parsed.data.itemId
      ? await removeFromWishlist(user.id, parsed.data.itemId)
      : await removeFromWishlistByProduct(user.id, parsed.data.productId!);

    if (!deleted) {
      return NextResponse.json(
        { error: "Wishlist item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting from wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
