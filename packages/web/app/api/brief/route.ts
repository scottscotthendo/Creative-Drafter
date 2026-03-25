import { NextRequest, NextResponse } from "next/server";
import { createNotionClient, fetchBrief } from "@creative-drafter/core";

export async function POST(req: NextRequest) {
  try {
    const { notionUrl } = await req.json();

    if (!notionUrl) {
      return NextResponse.json(
        { error: "notionUrl is required" },
        { status: 400 }
      );
    }

    const notionKey = process.env.NOTION_API_KEY;
    if (!notionKey) {
      return NextResponse.json(
        { error: "NOTION_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = createNotionClient(notionKey);
    const brief = await fetchBrief(client, notionUrl);

    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
