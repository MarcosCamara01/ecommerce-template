import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { wishlist } from "@/lib/db/schema";
import { getUser } from "@/lib/auth/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ items: [] });

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const items = await db.query.wishlist.findMany({
    where: eq(wishlist.user_id, user.id),
    orderBy: [desc(wishlist.updated_at)],
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (typeof productId !== "number") {
    return NextResponse.json({ error: "invalid productId" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const existing = await db.query.wishlist.findFirst({
    where: and(
      eq(wishlist.user_id, user.id),
      eq(wishlist.product_id, productId)
    ),
  });
  if (existing) return NextResponse.json({ item: existing });

  const [created] = await db
    .insert(wishlist)
    .values({
      user_id: user.id,
      product_id: productId,
      updated_at: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json({ item: created });
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const productId = searchParams.get("productId");

  if (!itemId && !productId) {
    return NextResponse.json({ error: "missing identifier" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const conditions = [
    eq(wishlist.user_id, user.id),
    ...(itemId ? [eq(wishlist.id, Number(itemId))] : []),
    ...(productId ? [eq(wishlist.product_id, Number(productId))] : []),
  ];

  await db.delete(wishlist).where(and(...conditions));

  return NextResponse.json({ ok: true });
}

