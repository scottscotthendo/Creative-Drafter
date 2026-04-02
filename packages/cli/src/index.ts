#!/usr/bin/env node

import "dotenv/config";
import * as p from "@clack/prompts";
import {
  createNotionClient,
  fetchBrief,
  parseBriefFromMarkdown,
  createAnalyzer,
  createPromptEngineer,
  selectModels,
  configureGenerator,
  generate,
} from "@heidi/core";
import type { NotionBrief, StructuredBrief } from "@heidi/core";
import { writeFile, mkdir, stat } from "fs/promises";
import { join, resolve, extname } from "path";

async function main() {
  p.intro("Heidi Creative Studio");

  // ─── Validate required env vars (Notion is optional) ──────────
  const missingKeys: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missingKeys.push("ANTHROPIC_API_KEY");
  if (!process.env.FAL_KEY) missingKeys.push("FAL_KEY");

  if (missingKeys.length > 0) {
    p.cancel(
      `Missing environment variables: ${missingKeys.join(", ")}\nCopy .env.example to .env and fill in your keys.`
    );
    process.exit(1);
  }

  // ─── Parse --ref flags for explicit attachment paths ───────────
  const refPaths: string[] = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--ref" && process.argv[i + 1]) {
      refPaths.push(resolve(process.argv[i + 1]));
      i++; // skip the value
    }
  }

  // ─── Get input source ─────────────────────────────────────────
  const rawInput = process.argv[2];
  let inputSource: "notion" | "file" | "ask" = "ask";

  if (rawInput && !rawInput.startsWith("--")) {
    // Determine if it's a file path or Notion URL
    if (rawInput.includes("notion.so") || rawInput.match(/^[a-f0-9-]{32,36}$/)) {
      inputSource = "notion";
    } else {
      // Check if it's a local file
      try {
        const s = await stat(rawInput);
        if (s.isFile()) inputSource = "file";
      } catch {
        // Not a file — assume Notion URL
        inputSource = "notion";
      }
    }
  }

  let briefInput: string;

  if (inputSource === "ask") {
    const source = await p.select({
      message: "How do you want to load the brief?",
      options: [
        {
          value: "file",
          label: "Markdown file",
          hint: "Notion export or any .md file + attachments",
        },
        {
          value: "notion",
          label: "Notion URL",
          hint: "requires NOTION_API_KEY in .env",
        },
      ],
    });

    if (p.isCancel(source)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    inputSource = source as "notion" | "file";

    if (inputSource === "file") {
      const filePath = await p.text({
        message: "Path to markdown file:",
        placeholder: "./brief.md or ./My Brief abc123.md",
        validate: (val) =>
          val.trim() ? undefined : "Please enter a file path",
      });
      if (p.isCancel(filePath)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }
      briefInput = filePath as string;
    } else {
      if (!process.env.NOTION_API_KEY) {
        p.cancel(
          "NOTION_API_KEY is not set in .env. Use a markdown file instead, or add your Notion API key."
        );
        process.exit(1);
      }
      const url = await p.text({
        message: "Notion brief URL:",
        placeholder: "https://notion.so/your-brief-page...",
        validate: (val) =>
          val.trim() ? undefined : "Please enter a Notion URL",
      });
      if (p.isCancel(url)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }
      briefInput = url as string;
    }
  } else {
    briefInput = rawInput;
  }

  // ─── Load brief ───────────────────────────────────────────────
  const briefSpinner = p.spinner();
  let brief: NotionBrief;

  if (inputSource === "file") {
    briefSpinner.start("Reading markdown brief...");
    try {
      const fullPath = resolve(briefInput);
      brief = await parseBriefFromMarkdown(fullPath, refPaths.length > 0 ? refPaths : undefined);
      briefSpinner.stop(`Brief loaded: "${brief.title}"`);
    } catch (err) {
      briefSpinner.stop("Failed to read file");
      p.cancel(err instanceof Error ? err.message : "Unknown error");
      process.exit(1);
    }
  } else {
    if (!process.env.NOTION_API_KEY) {
      p.cancel(
        "NOTION_API_KEY is not set. Use a markdown file instead:\n  pixel-pusher ./brief.md"
      );
      process.exit(1);
    }
    briefSpinner.start("Reading brief from Notion...");
    try {
      const client = createNotionClient(process.env.NOTION_API_KEY);
      brief = await fetchBrief(client, briefInput);
      briefSpinner.stop(`Brief loaded: "${brief.title}"`);
    } catch (err) {
      briefSpinner.stop("Failed to load brief");
      p.cancel(err instanceof Error ? err.message : "Unknown error");
      process.exit(1);
    }
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

  // Show warnings (e.g., skipped Notion-hosted URLs)
  if (brief.warnings?.length) {
    for (const warning of brief.warnings) {
      p.log.warn(warning);
    }
  }

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

  // ─── Prompt engineering + generation (with feedback loop) ───────
  const promptEngineer = createPromptEngineer(process.env.ANTHROPIC_API_KEY!);
  configureGenerator(process.env.FAL_KEY!);

  const outputDir =
    process.argv.includes("--output")
      ? process.argv[process.argv.indexOf("--output") + 1]
      : "./output";
  await mkdir(outputDir, { recursive: true });

  let attempt = 1;
  let imageIteration: { previousPrompt: string; feedback: string } | undefined;
  let videoIteration: { previousPrompt: string; feedback: string } | undefined;

  while (true) {
    const attemptLabel = attempt > 1 ? ` (attempt ${attempt})` : "";

    // ── Image generation ────────────────────────────────────────
    if (selections.image) {
      const imgSpinner = p.spinner();
      imgSpinner.start(`Crafting image prompt for ${selections.image.model.name}${attemptLabel}...`);
      const { prompt, negativePrompt } = await promptEngineer.craftPrompt(
        structuredBrief,
        selections.image.model,
        imageIteration
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
          referenceImageUrls: structuredBrief.referenceImages.map(
            (r: { url: string }) => r.url
          ),
        }
      );
      genSpinner.stop(
        result.status === "completed"
          ? `Generated ${result.outputs.length} image(s)`
          : "Generation failed"
      );

      for (let i = 0; i < result.outputs.length; i++) {
        const output = result.outputs[i];
        const ext = output.format?.includes("png") ? "png" : "jpg";
        const filename = `${slugify(structuredBrief.title)}-image-v${attempt}-${i + 1}.${ext}`;
        try {
          const response = await fetch(output.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          await writeFile(join(outputDir, filename), buffer);
          p.log.success(`Saved: ${join(outputDir, filename)}`);
        } catch {
          p.log.warn(`Could not save ${filename}, URL: ${output.url}`);
        }
      }

      // Ask for feedback
      const imageFeedback = await p.select({
        message: "How's the image?",
        options: [
          { value: "done", label: "✓  Looks good" },
          { value: "feedback", label: "↺  Try again with feedback" },
        ],
      });
      if (p.isCancel(imageFeedback) || imageFeedback === "done") {
        imageIteration = undefined;
      } else {
        const feedbackText = await p.text({
          message: "What should change?",
          placeholder: "e.g. warmer lighting, more close-up, different angle...",
        });
        if (!p.isCancel(feedbackText)) {
          imageIteration = { previousPrompt: prompt, feedback: feedbackText as string };
        }
      }
    }

    // ── Video generation ────────────────────────────────────────
    if (selections.video) {
      const vidSpinner = p.spinner();
      vidSpinner.start(`Crafting video prompt for ${selections.video.model.name}${attemptLabel}...`);
      const { prompt } = await promptEngineer.craftPrompt(
        structuredBrief,
        selections.video.model,
        videoIteration
      );
      vidSpinner.stop(`Prompt: ${prompt.slice(0, 80)}...`);

      const genSpinner = p.spinner();
      genSpinner.start("Generating video (this may take a while)...");
      const result = await generate(
        structuredBrief,
        selections.video.model,
        prompt,
        {
          referenceImageUrls: structuredBrief.referenceImages.map(
            (r: { url: string }) => r.url
          ),
        }
      );
      genSpinner.stop(
        result.status === "completed"
          ? `Generated ${result.outputs.length} video(s)`
          : "Generation failed"
      );

      for (let i = 0; i < result.outputs.length; i++) {
        const output = result.outputs[i];
        const filename = `${slugify(structuredBrief.title)}-video-v${attempt}-${i + 1}.mp4`;
        try {
          const response = await fetch(output.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          await writeFile(join(outputDir, filename), buffer);
          p.log.success(`Saved: ${join(outputDir, filename)}`);
        } catch {
          p.log.warn(`Could not save ${filename}, URL: ${output.url}`);
        }
      }

      // Ask for feedback
      const videoFeedback = await p.select({
        message: "How's the video?",
        options: [
          { value: "done", label: "✓  Looks good" },
          { value: "feedback", label: "↺  Try again with feedback" },
        ],
      });
      if (p.isCancel(videoFeedback) || videoFeedback === "done") {
        videoIteration = undefined;
      } else {
        const feedbackText = await p.text({
          message: "What should change?",
          placeholder: "e.g. slower motion, brighter scene, show hands...",
        });
        if (!p.isCancel(feedbackText)) {
          videoIteration = { previousPrompt: prompt, feedback: feedbackText as string };
        }
      }
    }

    // If no more feedback pending, we're done
    if (!imageIteration && !videoIteration) break;
    attempt++;
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
