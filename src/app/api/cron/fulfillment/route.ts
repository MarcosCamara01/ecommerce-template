import { NextRequest, NextResponse } from "next/server";

import { runFulfillmentSweep } from "@/lib/order-fulfillment";
import { getOrderFulfillmentSystemPrincipal } from "@/lib/order-fulfillment/system-principal";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const systemPrincipal = getOrderFulfillmentSystemPrincipal();
  return NextResponse.json(
    await runFulfillmentSweep(systemPrincipal, { limit: 10 }),
  );
}
