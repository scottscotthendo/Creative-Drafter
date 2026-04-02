import { NextRequest, NextResponse } from "next/server";
import { parseBriefFromMarkdownText } from "@heidi/core";
import type { MediaAttachment } from "@heidi/core";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const markdownFile = formData.get("markdown") as File | null;
    const markdownText = formData.get("markdownText") as string | null;

    const content = markdownFile
      ? await markdownFile.text()
      : markdownText;

    if (!content) {
      return NextResponse.json(
        { error: "No markdown file or text provided" },
        { status: 400 }
      );
    }

    // Process attached media files — convert to data URLs for preview
    // and object URLs the generation API can reference
    const mediaAttachments: MediaAttachment[] = [];
    const mediaEntries = formData.getAll("media") as File[];

    for (const file of mediaEntries) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type || "application/octet-stream";
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const isVideo = file.type.startsWith("video/");
      mediaAttachments.push({
        url: dataUrl,
        name: file.name,
        type: isVideo ? "video" : "image",
      });
    }

    const brief = parseBriefFromMarkdownText(content, mediaAttachments);

    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
