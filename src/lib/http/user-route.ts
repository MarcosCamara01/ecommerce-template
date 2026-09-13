import { NextResponse } from "next/server";
import { z } from "zod";

import { DataAccessError } from "@/lib/data-access";
import {
  IdentityError,
  identityErrorHttpStatus,
} from "@/lib/identity";

class InvalidJsonBodyError extends Error {}

export async function readJsonBody(
  request: Pick<Request, "json">,
): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new InvalidJsonBodyError();
    throw error;
  }
}

export function userRouteError(
  error: unknown,
  options: {
    invalidPayloadMessage: string;
    logContext: string;
  },
) {
  if (error instanceof IdentityError) {
    return NextResponse.json(
      { error: error.code },
      { status: identityErrorHttpStatus(error) },
    );
  }
  if (error instanceof DataAccessError && error.code === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: options.invalidPayloadMessage, details: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof InvalidJsonBodyError) {
    return NextResponse.json(
      { error: options.invalidPayloadMessage },
      { status: 400 },
    );
  }
  console.error(`${options.logContext} route failed`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
