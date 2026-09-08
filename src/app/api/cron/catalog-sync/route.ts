import { NextRequest, NextResponse } from "next/server";
import { revalidateProducts } from "@/lib/catalog-sync/revalidate";
import { runCatalogSyncSweep } from "@/lib/catalog-sync/service";
import { getCatalogSyncSystemPrincipal } from "@/lib/catalog-sync/system-principal";
import { internalCredentialFailure } from "@/lib/http/internal-route";

export async function GET(request: NextRequest) {
  const credentialFailure = internalCredentialFailure(request.headers);
  if (credentialFailure) return credentialFailure;
  const systemPrincipal = getCatalogSyncSystemPrincipal();
  const results = await runCatalogSyncSweep(systemPrincipal, { limit: 10 });
  const ids = new Set<number>();
  for (const item of results) {
    if (item.outcome === "succeeded") ids.add(item.productId);
  }
  await Promise.all(Array.from(ids, revalidateProducts));
  return NextResponse.json({ processed: results.length, results });
}
