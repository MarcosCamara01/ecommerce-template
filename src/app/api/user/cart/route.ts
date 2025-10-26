import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { getUser } from "@/libs/auth/server";
import { CartItem, ProductSize } from "@/schemas/ecommerce";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ items: [] });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data });
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
      quantity = 1,
    } = body as {
      variant_id: number;
      size: ProductSize;
      quantity?: number;
    };

    const supabase = createServiceClient();

    // check if the item already exists with the same variant and size
    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("variant_id", variant_id)
      .eq("size", size)
      .maybeSingle<CartItem>();

    let result;
    if (existing) {
      // update quantity if it exists
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single<CartItem>();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    } else {
      // insert new item if it doesn't exist
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          variant_id,
          size,
          quantity,
          user_id: user.id,
        })
        .select("*")
        .single<CartItem>();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
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

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single<CartItem>();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ item: data });
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

    const supabase = createServiceClient();
    let query = supabase.from("cart_items").delete().eq("user_id", user.id);

    if (itemId) {
      // delete a specific item
      query = query.eq("id", Number(itemId));
    }

    const { error } = await query;

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart item(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
