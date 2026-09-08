import { NextResponse } from "next/server";
import { z } from "zod";

import { CatalogSyncError, type CatalogSyncState } from "./model";
import type { CatalogSyncResult } from "./engine";
import { fieldErrorsFromZod } from "./admin-errors";

export const validation = (error: z.ZodError) =>
  NextResponse.json(
    { error: "Invalid product payload", errors: fieldErrorsFromZod(error) },
    { status: 400 },
  );

export const domainError = (error: CatalogSyncError, retryable?: boolean) =>
  NextResponse.json(
    { error: error.message, code: error.code, retryable },
    {
      status:
        error.code === "not_found"
          ? 404
          : error.code === "conflict"
            ? 409
            : 400,
    },
  );

export function queued(
  operationId: string,
  state: CatalogSyncState,
  message: string,
) {
  return NextResponse.json(
    {
      success: true,
      accepted: true,
      message,
      operationId,
      syncState: state,
      retryable: true,
    },
    { status: 202 },
  );
}

export function pending(
  result: Pick<CatalogSyncResult, "operationId" | "state" | "outcome">,
) {
  if (result.outcome === "needs_attention") {
    return NextResponse.json(
      {
        success: false,
        error: "Catalog mutation requires attention",
        operationId: result.operationId,
        syncState: result.state,
        retryable: false,
      },
      { status: 409 },
    );
  }
  return queued(
    result.operationId,
    result.state,
    "Catalog mutation is being synchronized",
  );
}
