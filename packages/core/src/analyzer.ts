import Anthropic from "@anthropic-ai/sdk";
import type { NotionBrief, StructuredBrief, ClarificationResult } from "./types.js";

const SYSTEM_PROMPT = `You are a senior creative director analyzing design briefs. Your job is to evaluate whether a brief has enough information to generate high-quality creative assets (images and/or videos).

Analyze the brief across these dimensions:
1. OUTPUT TYPE — Is it clear what's needed? (static image, video, both, social media graphic, poster, etc.)
2. DIMENSIONS / ASPECT RATIO — Are the required dimensions specified or inferable? (e.g., Instagram = 1080x1080, YouTube thumbnail = 1280x720)
3. STYLE & MOOD — Is the visual direction clear? (photorealistic, illustrated, minimalist, bold, etc.)
4. TEXT CONTENT — If the design needs text, is it provided? (headlines, CTAs, body copy)
5. COLOR PALETTE — Are brand colors or color preferences mentioned?
6. TARGET AUDIENCE — Who is this for? This affects style choices.
7. REFERENCE MATERIAL — Are there reference images/videos? How should they be used?
8. VIDEO SPECIFICS — If video: duration, motion style, transitions, audio needs?
9. QUALITY LEVEL — Is this a quick draft for review or a polished final asset?
10. BUDGET SENSITIVITY — Any hints about cost constraints?

IMPORTANT RULES:
- Only ask questions about information that is GENUINELY MISSING and would change the output.
- Don't ask about things that can be reasonably inferred. E.g., if they say "Instagram post" you know it's 1080x1080.
- Don't ask more than 4 questions at a time. Prioritize the most impactful gaps.
- If the brief is clear enough to proceed (even with some assumptions), say so and state your assumptions.
- Be conversational, not robotic. You're a creative collaborator, not a form.

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
