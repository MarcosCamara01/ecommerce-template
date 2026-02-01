import { NextResponse } from "next/server";
import { cartRepository } from "@/lib/db/drizzle/repositories";
import { ProductSize } from "@/lib/db/drizzle/schema";
import { getUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ items: [] });

    const items = await cartRepository.findByUserId(user.id);
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

    const body = await req.json();
    const {
      variantId,
      size,
      stripeId,
      quantity = 1,
    } = body as {
      variantId: number;
      size: ProductSize;
      stripeId: string;
      quantity?: number;
    };

    const result = await cartRepository.upsert({
      userId: user.id,
      variantId,
      size,
      stripeId,
      quantity,
    });

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

    const body = await req.json();
    const { id, quantity } = body as {
      id: number;
      quantity: number;
    };

    const result = await cartRepository.updateQuantity(user.id, id, quantity);
    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (itemId) {
      // Delete a specific item
      await cartRepository.delete(user.id, Number(itemId));
    } else {
      // Clear all cart items for user
      await cartRepository.clearByUserId(user.id);
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
