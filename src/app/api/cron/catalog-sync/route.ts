import { NextRequest, NextResponse } from "next/server";
import { revalidateProducts } from "@/lib/catalog-sync/revalidate";
import { runCatalogSyncSweep } from "@/lib/catalog-sync/service";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await runCatalogSyncSweep(10);
  const ids = Array.from(
    new Set(
      results
        .filter((item) => item.outcome === "succeeded")
        .map((item) => item.productId),
    ),
  );
  await Promise.all(ids.map(revalidateProducts));
  return NextResponse.json({ processed: results.length, results });
}
