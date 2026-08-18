import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";

import {
  IdentityError,
  updateIdentityProfileFromHeaders,
} from "@/lib/identity";
import { UpdateProfileSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid profile payload" },
          { status: 400 },
        );
      }
      throw error;
    }
    const input = UpdateProfileSchema.pick({ name: true })
      .required({ name: true })
      .parse(payload);
    const updatedUser = await updateIdentityProfileFromHeaders(
      request.headers,
      { name: input.name },
    );
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (
      error instanceof IdentityError ||
      (error instanceof APIError && error.statusCode === 401)
    ) {
      return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
    }
    console.error("User update failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
