import type { NotionBrief, MediaAttachment } from "./types.js";
import { readFile, readdir, stat } from "fs/promises";
import { join, extname, basename, dirname } from "path";

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".tiff",
]);
const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v",
]);

/**
 * Parse a Notion markdown export (or any markdown file) into a NotionBrief.
 *
 * Notion exports look like:
 *   My Page Title abc123.md
 *   My Page Title abc123/        ← folder with attachments
 *     image1.png
 *     video1.mp4
 *
 * Also supports a plain markdown file with media in the same directory,
 * or explicit attachment paths.
 */
export async function parseBriefFromMarkdown(
  markdownPath: string,
  attachmentPaths?: string[]
): Promise<NotionBrief> {
  const content = await readFile(markdownPath, "utf-8");
  const title = extractMarkdownTitle(content, markdownPath);
  const properties = extractFrontmatter(content);
  const bodyText = stripFrontmatter(content);

  // Discover media from:
  // 1. Explicit attachment paths passed in
  // 2. Notion-style companion folder (same name as .md file minus extension)
  // 3. Media referenced in markdown image/video syntax
  // 4. Media files in the same directory
  const allMedia = await discoverMedia(markdownPath, attachmentPaths);
  const images = allMedia.filter((m) => m.type === "image");
  const videos = allMedia.filter((m) => m.type === "video");

  // Also extract any image/video URLs referenced inline in the markdown
  const inlineMedia = extractInlineMedia(content);
  images.push(...inlineMedia.filter((m) => m.type === "image"));
  videos.push(...inlineMedia.filter((m) => m.type === "video"));

  return {
    pageId: `local:${basename(markdownPath)}`,
    title,
    bodyText,
    properties,
    images,
    videos,
  };
}

/**
 * Parse a brief from raw markdown text (for web uploads where there's no file path).
 */
export function parseBriefFromMarkdownText(
  markdownText: string,
  mediaAttachments?: MediaAttachment[]
): NotionBrief {
  const title = extractMarkdownTitle(markdownText);
  const properties = extractFrontmatter(markdownText);
  const bodyText = stripFrontmatter(markdownText);
  const allMedia = mediaAttachments || [];

  return {
    pageId: `upload:${Date.now()}`,
    title,
    bodyText,
    properties,
    images: allMedia.filter((m) => m.type === "image"),
    videos: allMedia.filter((m) => m.type === "video"),
  };
}

function extractMarkdownTitle(content: string, filePath?: string): string {
  // Try to find a # heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  // Fall back to filename (strip Notion's hex suffix if present)
  if (filePath) {
    let name = basename(filePath, extname(filePath));
    // Notion appends a hex ID like " abc123def456"
    name = name.replace(/\s+[a-f0-9]{32}$/, "");
    return name || "Untitled";
  }

  return "Untitled";
}

/**
 * Extract YAML-like frontmatter properties.
 * Supports the simple `key: value` format Notion sometimes uses,
 * and standard --- fenced YAML frontmatter.
 */
function extractFrontmatter(content: string): Record<string, string> {
  const props: Record<string, string> = {};

  const fenced = content.match(/^---\n([\s\S]*?)\n---/);
  if (fenced) {
    const lines = fenced[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
      if (match) {
        props[match[1].trim()] = match[2].trim();
      }
    }
  }

  return props;
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
}

async function discoverMedia(
  markdownPath: string,
  explicitPaths?: string[]
): Promise<MediaAttachment[]> {
  const media: MediaAttachment[] = [];

  // 1. Explicit attachment paths
  if (explicitPaths?.length) {
    for (const p of explicitPaths) {
      const attachment = classifyMediaFile(p);
      if (attachment) media.push(attachment);
    }
  }

  const dir = dirname(markdownPath);
  const mdName = basename(markdownPath, extname(markdownPath));

  // 2. Notion-style companion folder
  const companionDir = join(dir, mdName);
  try {
    const stats = await stat(companionDir);
    if (stats.isDirectory()) {
      const files = await readdir(companionDir);
      for (const file of files) {
        const attachment = classifyMediaFile(join(companionDir, file));
        if (attachment) media.push(attachment);
      }
    }
  } catch {
    // Companion folder doesn't exist — that's fine
  }

  // 3. If no media found yet, scan the same directory for media files
  if (media.length === 0) {
    try {
      const files = await readdir(dir);
      for (const file of files) {
        const fullPath = join(dir, file);
        const attachment = classifyMediaFile(fullPath);
        if (attachment) media.push(attachment);
      }
    } catch {
      // Can't read directory
    }
  }

  return media;
}

function classifyMediaFile(filePath: string): MediaAttachment | null {
  const ext = extname(filePath).toLowerCase();

  if (IMAGE_EXTENSIONS.has(ext)) {
    return {
      url: filePath,
      name: basename(filePath),
      type: "image",
      localPath: filePath,
    };
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    return {
      url: filePath,
      name: basename(filePath),
      type: "video",
      localPath: filePath,
    };
  }
  return null;
}

/**
 * Extract media referenced inline in markdown:
 *   ![alt](url)           → image
 *   [text](url.mp4)       → video (by extension)
 *   ![alt](./local/path)  → local image
 */
function extractInlineMedia(content: string): MediaAttachment[] {
  const media: MediaAttachment[] = [];
  const linkRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const isImage = match[0].startsWith("!");
    const alt = match[1];
    const url = match[2];
    const ext = extname(url).toLowerCase();

    if (isImage || IMAGE_EXTENSIONS.has(ext)) {
      media.push({ url, name: alt || basename(url), type: "image" });
    } else if (VIDEO_EXTENSIONS.has(ext)) {
      media.push({ url, name: alt || basename(url), type: "video" });
    }
  }

  return media;
}
