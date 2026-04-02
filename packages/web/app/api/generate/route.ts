import { NextRequest, NextResponse } from "next/server";
import {
  configureGenerator,
  generate,
  selectModel,
  createPromptEngineer,
} from "@heidi/core";
import type { StructuredBrief } from "@heidi/core";

export async function POST(req: NextRequest) {
  try {
    const { brief, modelOverride, iteration } = (await req.json()) as {
      brief: StructuredBrief;
      modelOverride?: string;
      iteration?: { previousPrompt: string; feedback: string };
    };

    const falKey = process.env.FAL_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!falKey) {
      return NextResponse.json(
        { error: "FAL_KEY is not configured" },
        { status: 500 }
      );
    }
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    configureGenerator(falKey);

    // Select model
    const selection = selectModel(brief);
    const model = modelOverride
      ? (await import("@heidi/core")).getModelById(modelOverride) ||
        selection.model
      : selection.model;

    // Craft optimized prompt — pass iteration context if refining
    const promptEngineer = createPromptEngineer(anthropicKey);
    const { prompt, negativePrompt } = await promptEngineer.craftPrompt(
      brief,
      model,
      iteration
    );

    // Generate
    const result = await generate(brief, model, prompt, {
      negativePrompt,
      referenceImageUrls: brief.referenceImages.map((r) => r.url),
    });

    return NextResponse.json({
      result,
      modelSelection: {
        model: selection.model,
        reasoning: selection.reasoning,
        estimatedCost: selection.estimatedCost,
      },
      promptUsed: prompt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
