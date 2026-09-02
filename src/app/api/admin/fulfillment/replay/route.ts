import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { dataAccess } from "@/lib/data-access";
import {
  IdentityError,
  requireCapabilityFromHeaders,
} from "@/lib/identity";

const replaySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("work"),
    checkoutSessionId: z.string().startsWith("cs_"),
    reason: z.string().trim().min(1).max(500),
  }),
  z.object({
    kind: z.literal("effect"),
    effectId: z.number().int().positive(),
    reason: z.string().trim().min(1).max(500),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const principal = await requireCapabilityFromHeaders(
      request.headers,
      "fulfillment:manage",
    );
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { message: "Invalid replay request" },
          { status: 400 },
        );
      }
      throw error;
    }
    const replay = replaySchema.parse(payload);
    const operator = dataAccess.forFulfillmentOperator(principal);
    const accepted = replay.kind === "work"
      ? await operator.replayWork(replay.checkoutSessionId, replay.reason)
      : await operator.replayEffect(replay.effectId, replay.reason);
    if (!accepted) {
      return NextResponse.json(
        { message: "No terminal fulfillment item found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid replay request" }, { status: 400 });
    }
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: error.code === "authentication_required" ? 401 : 403 },
      );
    }
    return NextResponse.json({ message: "Replay failed" }, { status: 500 });
  }
}
