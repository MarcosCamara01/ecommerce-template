import { NextResponse } from "next/server";

import {
  InternalIdentityError,
  internalIdentityErrorHttpStatus,
  requireCronCredentialFromHeaders,
} from "@/lib/identity";

export function internalCredentialFailure(headers: Headers) {
  try {
    requireCronCredentialFromHeaders(headers);
    return null;
  } catch (error) {
    if (!(error instanceof InternalIdentityError)) throw error;
    return NextResponse.json(
      {
        error: error.code === "not_configured"
          ? "Cron is not configured"
          : "Unauthorized",
      },
      { status: internalIdentityErrorHttpStatus(error) },
    );
  }
}
