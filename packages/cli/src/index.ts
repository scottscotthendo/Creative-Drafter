#!/usr/bin/env node

import "dotenv/config";
import * as p from "@clack/prompts";
import {
  createNotionClient,
  fetchBrief,
  createAnalyzer,
  createPromptEngineer,
  selectModel,
  selectModels,
  configureGenerator,
  generate,
} from "@creative-drafter/core";
import type { NotionBrief, StructuredBrief } from "@creative-drafter/core";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function main() {
  p.intro("Creative Drafter");

  // ─── Validate env vars ────────────────────────────────────────
  const missingKeys: string[] = [];
  if (!process.env.NOTION_API_KEY) missingKeys.push("NOTION_API_KEY");
  if (!process.env.ANTHROPIC_API_KEY) missingKeys.push("ANTHROPIC_API_KEY");
  if (!process.env.FAL_KEY) missingKeys.push("FAL_KEY");

  if (missingKeys.length > 0) {
    p.cancel(
      `Missing environment variables: ${missingKeys.join(", ")}\nCopy .env.example to .env and fill in your keys.`
    );
    process.exit(1);
  }

  // ─── Get Notion URL ───────────────────────────────────────────
  const notionUrl =
    process.argv[2] ||
    (await p.text({
      message: "Notion brief URL:",
      placeholder: "https://notion.so/your-brief-page...",
      validate: (val) =>
        val.trim() ? undefined : "Please enter a Notion URL or page ID",
    }));

  if (p.isCancel(notionUrl)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  // ─── Fetch brief ──────────────────────────────────────────────
  const briefSpinner = p.spinner();
  briefSpinner.start("Reading brief from Notion...");

  let brief: NotionBrief;
  try {
    const client = createNotionClient(process.env.NOTION_API_KEY!);
    brief = await fetchBrief(client, notionUrl as string);
    briefSpinner.stop(`Brief loaded: "${brief.title}"`);
  } catch (err) {
    briefSpinner.stop("Failed to load brief");
    p.cancel(err instanceof Error ? err.message : "Unknown error");
    process.exit(1);
  }

  // Show brief summary
  p.note(
    [
      brief.bodyText.slice(0, 300) + (brief.bodyText.length > 300 ? "..." : ""),
      "",
      `${brief.images.length} images · ${brief.videos.length} videos attached`,
      Object.entries(brief.properties)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
    ]
      .filter(Boolean)
      .join("\n"),
    brief.title
  );

  // ─── Clarification loop ───────────────────────────────────────
  const analyzer = createAnalyzer(process.env.ANTHROPIC_API_KEY!);
  let structuredBrief: StructuredBrief | null = null;
  const allQuestions: string[] = [];
  const allAnswers: string[] = [];

  const clarifySpinner = p.spinner();
  clarifySpinner.start("Analyzing brief...");

  let clarification = await analyzer.analyze(brief);
  clarifySpinner.stop(
    clarification.complete
      ? "Brief is clear — ready to generate."
      : "Need a few clarifications."
  );

  while (!clarification.complete) {
    if (clarification.analysis) {
      p.log.info(clarification.analysis);
    }

    const questions = clarification.questions || [];
    const answers: string[] = [];

    for (const question of questions) {
      const answer = await p.text({
        message: question,
        placeholder: "Your answer...",
      });

      if (p.isCancel(answer)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      answers.push(answer as string);
    }

    allQuestions.push(...questions);
    allAnswers.push(...answers);

    const refineSpinner = p.spinner();
    refineSpinner.start("Re-analyzing with your answers...");
    clarification = await analyzer.refineWithAnswers(
      brief,
      allQuestions,
      allAnswers
    );
    refineSpinner.stop(
      clarification.complete
        ? "Brief is now clear."
        : "A few more questions..."
    );
  }

  structuredBrief = clarification.brief!;

  // ─── Model selection ──────────────────────────────────────────
  const selections = selectModels(structuredBrief);

  const modelLines: string[] = [];
  if (selections.image) {
    modelLines.push(
      `Image: ${selections.image.model.name} (${selections.image.estimatedCost})`,
      `  → ${selections.image.reasoning}`
    );
  }
  if (selections.video) {
    modelLines.push(
      `Video: ${selections.video.model.name} (${selections.video.estimatedCost})`,
      `  → ${selections.video.reasoning}`
    );
  }
  p.note(modelLines.join("\n"), "Model Recommendation");

  const proceed = await p.confirm({
    message: "Proceed with generation?",
  });

  if (p.isCancel(proceed) || !proceed) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  // ─── Prompt engineering ───────────────────────────────────────
  const promptEngineer = createPromptEngineer(process.env.ANTHROPIC_API_KEY!);
  configureGenerator(process.env.FAL_KEY!);

  // Generate for each output type
  const outputDir =
    process.argv.includes("--output")
      ? process.argv[process.argv.indexOf("--output") + 1]
      : "./output";
  await mkdir(outputDir, { recursive: true });

  if (selections.image) {
    const imgSpinner = p.spinner();
    imgSpinner.start(
      `Crafting prompt for ${selections.image.model.name}...`
    );
    const { prompt, negativePrompt } = await promptEngineer.craftPrompt(
      structuredBrief,
      selections.image.model
    );
    imgSpinner.stop(`Prompt: ${prompt.slice(0, 80)}...`);

    const genSpinner = p.spinner();
    genSpinner.start("Generating image...");
    const result = await generate(
      structuredBrief,
      selections.image.model,
      prompt,
      {
        negativePrompt,
        referenceImageUrls: structuredBrief.referenceImages.map((r: { url: string }) => r.url),
      }
    );
    genSpinner.stop(
      result.status === "completed"
        ? `Generated ${result.outputs.length} image(s)`
        : "Generation failed"
    );

    // Save outputs
    for (let i = 0; i < result.outputs.length; i++) {
      const output = result.outputs[i];
      const ext = output.format?.includes("png") ? "png" : "jpg";
      const filename = `${slugify(structuredBrief.title)}-image-${i + 1}.${ext}`;
      try {
        const response = await fetch(output.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(join(outputDir, filename), buffer);
        p.log.success(`Saved: ${join(outputDir, filename)}`);
      } catch {
        p.log.warn(`Could not save ${filename}, URL: ${output.url}`);
      }
    }
  }

  if (selections.video) {
    const vidSpinner = p.spinner();
    vidSpinner.start(
      `Crafting prompt for ${selections.video.model.name}...`
    );
    const { prompt } = await promptEngineer.craftPrompt(
      structuredBrief,
      selections.video.model
    );
    vidSpinner.stop(`Prompt: ${prompt.slice(0, 80)}...`);

    const genSpinner = p.spinner();
    genSpinner.start("Generating video (this may take a while)...");
    const result = await generate(
      structuredBrief,
      selections.video.model,
      prompt,
      {
        referenceImageUrls: structuredBrief.referenceImages.map((r: { url: string }) => r.url),
      }
    );
    genSpinner.stop(
      result.status === "completed"
        ? `Generated ${result.outputs.length} video(s)`
        : "Generation failed"
    );

    for (let i = 0; i < result.outputs.length; i++) {
      const output = result.outputs[i];
      const filename = `${slugify(structuredBrief.title)}-video-${i + 1}.mp4`;
      try {
        const response = await fetch(output.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(join(outputDir, filename), buffer);
        p.log.success(`Saved: ${join(outputDir, filename)}`);
      } catch {
        p.log.warn(`Could not save ${filename}, URL: ${output.url}`);
      }
    }
  }

  p.outro("Done! Check the output directory for your drafts.");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
