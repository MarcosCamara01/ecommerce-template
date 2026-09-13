import { NextRequest, NextResponse } from "next/server";

import { runFulfillmentSweep } from "@/lib/order-fulfillment";
import { getOrderFulfillmentSystemPrincipal } from "@/lib/order-fulfillment/system-principal";
import { internalCredentialFailure } from "@/lib/http/internal-route";

export async function GET(request: NextRequest) {
  const credentialFailure = internalCredentialFailure(request.headers);
  if (credentialFailure) return credentialFailure;
  const systemPrincipal = getOrderFulfillmentSystemPrincipal();
  return NextResponse.json(
    await runFulfillmentSweep(systemPrincipal, { limit: 10 }),
  );
}
