import { type NextRequest, NextResponse } from "next/server";

import { contactEmailSchema, sendContactEmail } from "@/lib/email/mailer";

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  if (body === null) {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = contactEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "We need more information to send the message.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await sendContactEmail(parsed.data);
    return NextResponse.json(
      { message: "Email sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Could not send contact email:", error);
    return NextResponse.json(
      { message: "Could not send the message" },
      { status: 500 },
    );
  }
}
