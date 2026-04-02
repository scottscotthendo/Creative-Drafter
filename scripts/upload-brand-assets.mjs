/**
 * One-time script: uploads Heidi brand illustrations to fal.ai storage.
 * Run with: node scripts/upload-brand-assets.mjs
 * Prints URLs to paste into packages/core/src/heidi-brand.ts
 */

import { fal } from "@fal-ai/client";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("FAL_KEY env var required");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const ASSETS = [
  { name: "ask-heidi",         path: "../packages/web/public/brand/illustrations/ask-heidi.png" },
  { name: "note-soap",         path: "../packages/web/public/brand/illustrations/note-soap.png" },
  { name: "generate-documents",path: "../packages/web/public/brand/illustrations/generate-documents.png" },
  { name: "note-custom",       path: "../packages/web/public/brand/illustrations/note-custom.png" },
];

for (const asset of ASSETS) {
  const fullPath = join(__dirname, asset.path);
  const buffer = await readFile(fullPath);
  const file = new File([buffer], `${asset.name}.png`, { type: "image/png" });
  const url = await fal.storage.upload(file);
  console.log(`"${asset.name}": "${url}",`);
}
