import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const { id: conversationId } = await context.params;
    const body = await req.json();

    const res = await fetch(
      `${API_URL}/api/v1/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { cookie: cookieHeader }),
        },
        credentials: "include",
        body: JSON.stringify(body),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
