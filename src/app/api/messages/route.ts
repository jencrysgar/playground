import { NextResponse } from "next/server";
import { addMessage, getMessages } from "@/lib/messages";

export async function GET() {
  return NextResponse.json({ messages: getMessages() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, text } = (body ?? {}) as { name?: unknown; text?: unknown };

  if (typeof name !== "string" || typeof text !== "string") {
    return NextResponse.json(
      { error: "Both 'name' and 'text' are required strings." },
      { status: 400 },
    );
  }

  const trimmedName = name.trim();
  const trimmedText = text.trim();

  if (!trimmedName || !trimmedText) {
    return NextResponse.json(
      { error: "Name and message cannot be empty." },
      { status: 400 },
    );
  }

  const message = addMessage(trimmedName, trimmedText);
  return NextResponse.json({ message }, { status: 201 });
}
