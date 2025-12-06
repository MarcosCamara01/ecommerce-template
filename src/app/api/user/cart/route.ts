import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { ProductSize } from "@/schemas";
import { getUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ items: [] });

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.user_id, user.id),
      orderBy: [desc(cartItems.updated_at)],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error getting cart items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
      variant_id,
      size,
      stripe_id,
      quantity = 1,
    } = body as {
      variant_id: number;
      size: ProductSize;
      stripe_id: string;
      quantity?: number;
    };

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const existing = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.user_id, user.id),
        eq(cartItems.variant_id, variant_id),
        eq(cartItems.size, size)
      ),
    });

    const timestamp = new Date().toISOString();
    let result;

    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({
          quantity: existing.quantity + quantity,
          updated_at: timestamp,
        })
        .where(
          and(eq(cartItems.id, existing.id), eq(cartItems.user_id, user.id))
        )
        .returning();

      result = updated;
    } else {
      const [inserted] = await db
        .insert(cartItems)
        .values({
          variant_id,
          size,
          quantity,
          stripe_id,
          user_id: user.id,
          updated_at: timestamp,
        })
        .returning();

      result = inserted;
    }

    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("Error adding/updating cart item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const [updated] = await db
      .update(cartItems)
      .set({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error updating cart item:", error);
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
    const itemId = searchParams.get("itemId");

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const where = itemId
      ? and(eq(cartItems.id, Number(itemId)), eq(cartItems.user_id, user.id))
      : eq(cartItems.user_id, user.id);

    await db.delete(cartItems).where(where);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart item(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
