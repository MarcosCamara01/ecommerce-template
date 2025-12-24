import { NextResponse } from "next/server";
import { wishlistRepository } from "@/lib/db/drizzle/repositories";
import { getUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ items: [] });

    const items = await wishlistRepository.findByUserId(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error getting wishlist items:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { productId } = await req.json();
    if (typeof productId !== "number") {
      return NextResponse.json({ error: "invalid productId" }, { status: 400 });
    }

    // Check if already exists for idempotency
    const exists = await wishlistRepository.exists(user.id, productId);
    if (exists) {
      const items = await wishlistRepository.findByUserId(user.id);
      const existingItem = items.find((i) => i.productId === productId);
      return NextResponse.json({ item: existingItem });
    }

    const item = await wishlistRepository.create({
      userId: user.id,
      productId,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = Number(searchParams.get("itemId"));
    const productId = Number(searchParams.get("productId"));

    if (!itemId && !productId) {
      return NextResponse.json(
        { error: "missing identifier" },
        { status: 400 }
      );
    }

    if (itemId) {
      await wishlistRepository.delete(user.id, itemId);
    } else if (productId) {
      await wishlistRepository.deleteByUserAndProduct(user.id, productId);
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
