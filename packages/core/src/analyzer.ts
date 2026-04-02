import Anthropic from "@anthropic-ai/sdk";
import type { NotionBrief, StructuredBrief, ClarificationResult } from "./types.js";
import { HEIDI_BRAND_CONTEXT } from "./heidi-brand.js";

const SYSTEM_PROMPT = `You are a senior creative director at Heidi Health, analysing briefs for Heidi Creative Studio — an internal tool for generating on-brand creative assets.

${HEIDI_BRAND_CONTEXT}

YOUR ROLE:
Evaluate whether a brief has enough information to generate high-quality creative assets (images and/or videos) that are genuinely on-brand for Heidi Health.

STEP 1 — CLASSIFY OUTPUT TYPE FIRST (before anything else):
Set outputType to "video" if the brief contains ANY of:
- Words: video, film, footage, clip, reel, motion, animation, ad, UGC, talking head, testimonial, pre-roll, story, TikTok, YouTube, Reels
- Time-based structure: durations in seconds, timestamps like [0:00–0:03], "5s", "15 seconds"
- Camera/motion direction: "shot", "scene", "cut", "b-roll", "talking to camera", "direct to camera"

Set outputType to "image" only if none of the above are present and the brief clearly describes a static asset (banner, poster, social graphic, illustration, etc.).

Set outputType to "both" only if the brief explicitly requests both static and video outputs.

This classification must be correct — it drives the entire generation pipeline.

STEP 2 — Analyse the brief across these dimensions:
1. DIMENSIONS / ASPECT RATIO — Are the required dimensions specified or inferable? (e.g., Instagram = 1080×1080, LinkedIn = 1200×627, TikTok/Reels = 9:16)
2. STYLE & MOOD — Is the visual direction clear? Does it align with Heidi's warm, human-centric aesthetic?
3. TEXT CONTENT — If the design needs text overlays or on-screen copy, is it provided?
4. COLOR PALETTE — Are colours specified? If not, default to Heidi's palette (Sunlight, Bark, Sand, Forest, Sky).
5. TARGET AUDIENCE — Clinicians, patients, internal teams, or external marketing?
6. REFERENCE MATERIAL — Are there reference images/videos? How should they be used?
7. VIDEO SPECIFICS — Duration, motion style, camera direction, transitions, audio/captions?
8. QUALITY LEVEL — Quick draft for review or polished final asset?
9. BRAND ALIGNMENT — Does the brief's intent align with Heidi's brand values? Flag anything that might feel cold, clinical, alarming, or off-tone.

IMPORTANT RULES:
- Only ask questions about information that is GENUINELY MISSING and would meaningfully change the output.
- Don't ask about things that can be reasonably inferred. If they say "Instagram post" you know it's 1080×1080. If no palette is mentioned, default to Heidi's palette.
- Don't ask more than 4 questions at a time. Prioritise the most impactful gaps.
- If the brief is clear enough to proceed (even with some assumptions), say so and state your assumptions.
- Be warm and conversational — you are a creative collaborator, not a form. Reflect Heidi's tone.
- Gently flag brand alignment concerns rather than rejecting the brief outright.

When the brief IS complete enough, respond with a JSON block containing the structured brief.`;

export function createAnalyzer(apiKey: string) {
  const anthropic = new Anthropic({ apiKey });

  return {
    analyze,
    refineWithAnswers,
  };

  async function analyze(
    brief: NotionBrief,
    userAnswers?: string[]
  ): Promise<ClarificationResult> {
    const briefContext = formatBriefForAnalysis(brief);
    const answersContext = userAnswers?.length
      ? `\n\nUser's answers to previous questions:\n${userAnswers.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the design brief to analyze:\n\n${briefContext}${answersContext}\n\nAnalyze this brief. If it's complete enough, respond with EXACTLY this format:\n\nBRIEF_COMPLETE\n\`\`\`json\n{structured brief JSON}\n\`\`\`\n\nIf you need clarification, respond with:\n\nNEEDS_CLARIFICATION\nAnalysis: <your analysis of what's clear and what's missing>\nQuestions:\n1. <question>\n2. <question>\n...`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return parseAnalysisResponse(text, brief);
  }

  async function refineWithAnswers(
    brief: NotionBrief,
    previousQuestions: string[],
    answers: string[]
  ): Promise<ClarificationResult> {
    const briefContext = formatBriefForAnalysis(brief);
    const qaContext = previousQuestions
      .map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no answer)"}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the design brief:\n\n${briefContext}\n\nHere are the clarifying Q&A:\n\n${qaContext}\n\nBased on the original brief AND these answers, is the brief now complete? Respond with BRIEF_COMPLETE + JSON or NEEDS_CLARIFICATION + more questions.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return parseAnalysisResponse(text, brief);
  }
}

function formatBriefForAnalysis(brief: NotionBrief): string {
  let text = `# ${brief.title}\n\n${brief.bodyText}`;

  if (Object.keys(brief.properties).length > 0) {
    text += "\n\n## Properties\n";
    for (const [key, value] of Object.entries(brief.properties)) {
      text += `- ${key}: ${value}\n`;
    }
  }

  if (brief.images.length > 0) {
    text += `\n\n## Attached Images (${brief.images.length})\n`;
    for (const img of brief.images) {
      text += `- ${img.name}\n`;
    }
  }

  if (brief.videos.length > 0) {
    text += `\n\n## Attached Videos (${brief.videos.length})\n`;
    for (const vid of brief.videos) {
      text += `- ${vid.name}\n`;
    }
  }

  return text;
}

function parseAnalysisResponse(
  text: string,
  originalBrief: NotionBrief
): ClarificationResult {
  if (text.includes("BRIEF_COMPLETE")) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]) as Partial<StructuredBrief>;
        const brief: StructuredBrief = {
          title: parsed.title || originalBrief.title,
          description: parsed.description || originalBrief.bodyText,
          outputType: parsed.outputType || "image",
          qualityTier: parsed.qualityTier || "standard",
          dimensions: parsed.dimensions,
          aspectRatio: parsed.aspectRatio,
          style: parsed.style,
          mood: parsed.mood,
          colorPalette: parsed.colorPalette,
          textContent: parsed.textContent,
          targetAudience: parsed.targetAudience,
          videoDuration: parsed.videoDuration,
          referenceImages: originalBrief.images,
          referenceVideos: originalBrief.videos,
          additionalContext: parsed.additionalContext || "",
          budgetSensitivity: parsed.budgetSensitivity || "medium",
        };
        return { complete: true, brief };
      } catch {
        // JSON parse failed — treat as needing clarification
      }
    }
  }

  // Parse questions
  const questions: string[] = [];
  const analysisMatch = text.match(/Analysis:\s*([\s\S]*?)(?=Questions:|$)/);
  const questionsMatch = text.match(/Questions:\s*([\s\S]*?)$/);

  if (questionsMatch) {
    const lines = questionsMatch[1].split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^\d+\.\s*/, "").trim();
      if (cleaned) questions.push(cleaned);
    }
  }

  return {
    complete: false,
    questions: questions.length > 0 ? questions : ["Could you provide more details about what you'd like to create?"],
    analysis: analysisMatch?.[1]?.trim(),
  };
}
