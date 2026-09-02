import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateProducts } from "@/lib/catalog-sync/revalidate";
import { createCatalogRouteHandler } from "@/app/api/admin/products/authorization";
import { CatalogSyncError } from "@/lib/catalog-sync/model";
import { createCatalogSyncManager } from "@/lib/catalog-sync/service";
import { IdentityError, identityErrorHttpStatus, requireCapabilityFromHeaders, type UserPrincipal } from "@/lib/identity";

const stripeResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("archive"),
    archivedPriceIds: z.array(z.string().min(1)).max(100),
  }),
  z.object({
    kind: z.literal("upsert"),
    variants: z.record(
      z.string().min(1),
      z.object({ productId: z.string().min(1), priceId: z.string().min(1) }),
    ),
    archivedPriceIds: z.array(z.string().min(1)).max(100),
  }),
]);
const schema = z.object({
  operationId: z.uuid(),
  reason: z.string().trim().min(10).max(500),
  reconciledStripeResult: stripeResultSchema.optional(),
});
async function replay(request: NextRequest, principal: UserPrincipal) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      throw error;
    }
    const input = schema.parse(payload);
    const manager = createCatalogSyncManager(principal);
    const operation = await manager.replay(
      input.operationId,
      input.reason,
      input.reconciledStripeResult,
    );
    const result = await manager.processOperation(operation.id);
    if (result.outcome === "succeeded") { await revalidateProducts(result.productId); return NextResponse.json({ success: true, ...result }); }
    return NextResponse.json({ accepted: true, ...result }, { status: result.outcome === "needs_attention" ? 409 : 202 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid replay payload", errors: error.flatten().fieldErrors }, { status: 400 });
    if (error instanceof CatalogSyncError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === "not_found" ? 404 : 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const POST = createCatalogRouteHandler(requireCapabilityFromHeaders, (error) => error instanceof IdentityError ? identityErrorHttpStatus(error) : null, replay);
