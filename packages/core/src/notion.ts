import { Client } from "@notionhq/client";
import type { NotionBrief, MediaAttachment } from "./types.js";

export function createNotionClient(apiKey: string): Client {
  return new Client({ auth: apiKey });
}

/**
 * Extract a page ID from a Notion URL or raw ID.
 * Handles formats like:
 *   - https://www.notion.so/Page-Title-abc123def456...
 *   - https://www.notion.so/workspace/abc123def456...
 *   - abc123def456 (raw ID, with or without dashes)
 */
export function extractPageId(input: string): string {
  const cleaned = input.trim();

  // If it looks like a URL, extract the last 32-char hex segment
  if (cleaned.includes("notion.so")) {
    const match = cleaned.match(/([a-f0-9]{32})/);
    if (match) {
      const raw = match[1];
      return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
    }
    // Try with dashes already present
    const dashMatch = cleaned.match(
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/
    );
    if (dashMatch) return dashMatch[1];
  }

  // If it's a raw 32-char hex string, format it
  const hexMatch = cleaned.match(/^([a-f0-9]{32})$/);
  if (hexMatch) {
    const raw = hexMatch[1];
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }

  // Assume it's already a properly formatted UUID
  return cleaned;
}

/**
 * Fetch a complete brief from a Notion page, including all blocks and media.
 */
export async function fetchBrief(
  client: Client,
  notionUrl: string
): Promise<NotionBrief> {
  const pageId = extractPageId(notionUrl);

  // Fetch page metadata for title and properties
  const page = await client.pages.retrieve({ page_id: pageId });
  const title = extractTitle(page);
  const properties = extractProperties(page);

  // Fetch all blocks (content) recursively
  const blocks = await fetchAllBlocks(client, pageId);
  const bodyText = blocksToText(blocks);
  const images = extractMedia(blocks, "image");
  const videos = extractMedia(blocks, "video");

  return { pageId, title, bodyText, properties, images, videos };
}

function extractTitle(page: Record<string, unknown>): string {
  const props = (page as { properties?: Record<string, unknown> }).properties;
  if (!props) return "Untitled";

  for (const value of Object.values(props)) {
    const prop = value as { type?: string; title?: Array<{ plain_text?: string }> };
    if (prop.type === "title" && prop.title) {
      return prop.title.map((t) => t.plain_text || "").join("") || "Untitled";
    }
  }
  return "Untitled";
}

function extractProperties(page: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  const props = (page as { properties?: Record<string, unknown> }).properties;
  if (!props) return result;

  for (const [key, value] of Object.entries(props)) {
    const prop = value as Record<string, unknown>;
    const text = propertyToText(prop);
    if (text) result[key] = text;
  }
  return result;
}

function propertyToText(prop: Record<string, unknown>): string | null {
  switch (prop.type) {
    case "title":
    case "rich_text": {
      const items = (prop[prop.type as string] as Array<{ plain_text?: string }>) || [];
      const text = items.map((t) => t.plain_text || "").join("");
      return text || null;
    }
    case "select": {
      const sel = prop.select as { name?: string } | null;
      return sel?.name || null;
    }
    case "multi_select": {
      const items = (prop.multi_select as Array<{ name?: string }>) || [];
      return items.map((s) => s.name).join(", ") || null;
    }
    case "number":
      return prop.number != null ? String(prop.number) : null;
    case "url":
      return (prop.url as string) || null;
    case "checkbox":
      return String(prop.checkbox);
    case "date": {
      const date = prop.date as { start?: string } | null;
      return date?.start || null;
    }
    default:
      return null;
  }
}

interface Block {
  id: string;
  type: string;
  has_children: boolean;
  children?: Block[];
  [key: string]: unknown;
}

async function fetchAllBlocks(client: Client, blockId: string): Promise<Block[]> {
  const blocks: Block[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      const b = block as unknown as Block;
      if (b.has_children) {
        b.children = await fetchAllBlocks(client, b.id);
      }
      blocks.push(b);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}

function blocksToText(blocks: Block[], depth = 0): string {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  for (const block of blocks) {
    const text = blockToText(block);
    if (text) lines.push(`${indent}${text}`);
    if (block.children) {
      lines.push(blocksToText(block.children, depth + 1));
    }
  }

  return lines.filter(Boolean).join("\n");
}

function blockToText(block: Block): string {
  const typeData = block[block.type] as Record<string, unknown> | undefined;
  if (!typeData) return "";

  // Extract rich text from most block types
  const richText = typeData.rich_text as Array<{ plain_text?: string }> | undefined;
  const text = richText?.map((t) => t.plain_text || "").join("") || "";

  switch (block.type) {
    case "paragraph":
      return text;
    case "heading_1":
      return `# ${text}`;
    case "heading_2":
      return `## ${text}`;
    case "heading_3":
      return `### ${text}`;
    case "bulleted_list_item":
      return `• ${text}`;
    case "numbered_list_item":
      return `- ${text}`;
    case "to_do": {
      const checked = (typeData.checked as boolean) ? "✓" : "○";
      return `${checked} ${text}`;
    }
    case "toggle":
      return `▸ ${text}`;
    case "quote":
      return `> ${text}`;
    case "callout":
      return `💡 ${text}`;
    case "code":
      return `\`\`\`\n${text}\n\`\`\``;
    case "divider":
      return "---";
    case "image":
    case "video":
      return `[${block.type}: ${getMediaCaption(typeData)}]`;
    default:
      return text;
  }
}

function getMediaCaption(data: Record<string, unknown>): string {
  const caption = data.caption as Array<{ plain_text?: string }> | undefined;
  return caption?.map((t) => t.plain_text || "").join("") || "(no caption)";
}

function extractMedia(blocks: Block[], mediaType: "image" | "video"): MediaAttachment[] {
  const media: MediaAttachment[] = [];

  for (const block of blocks) {
    if (block.type === mediaType) {
      const data = block[mediaType] as Record<string, unknown>;
      const url = getMediaUrl(data);
      const caption = getMediaCaption(data);
      if (url) {
        media.push({ url, name: caption, type: mediaType });
      }
    }
    if (block.children) {
      media.push(...extractMedia(block.children, mediaType));
    }
  }

  return media;
}

function getMediaUrl(data: Record<string, unknown>): string | null {
  if (data.type === "file") {
    const file = data.file as { url?: string };
    return file?.url || null;
  }
  if (data.type === "external") {
    const external = data.external as { url?: string };
    return external?.url || null;
  }
  return null;
}
