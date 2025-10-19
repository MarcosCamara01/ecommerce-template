// app/api/user/wishlist/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/auth/getUser";

type WishlistItem = {
  id: number;
  user_id: string;
  product_id: number;
  updated_at: string;
};

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ items: [] });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ items: [] }, { status: 200 });
  return NextResponse.json({ items: (data ?? []) as WishlistItem[] });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { productId } = await req.json();
  if (typeof productId !== "number") {
    return NextResponse.json({ error: "invalid productId" }, { status: 400 });
  }
  const supabase = await createClient();

  // Si ya existe, devolverlo tal cual para idempotencia
  const { data: existing } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle<WishlistItem>();
  if (existing) return NextResponse.json({ item: existing });

  const { data, error } = await supabase
    .from("wishlist")
    .insert({ user_id: user.id, product_id: productId })
    .select("*")
    .single<WishlistItem>();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const itemId = Number(searchParams.get("itemId"));
  const productId = Number(searchParams.get("productId"));
  if (!itemId && !productId) {
    return NextResponse.json({ error: "missing identifier" }, { status: 400 });
  }

  const supabase = await createClient();
  let q = supabase.from("wishlist").delete().eq("user_id", user.id);
  if (itemId) q = q.eq("id", itemId);
  if (productId) q = q.eq("product_id", productId);
  const { error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
