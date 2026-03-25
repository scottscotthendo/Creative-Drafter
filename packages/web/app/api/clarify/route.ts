import { NextRequest, NextResponse } from "next/server";
import { createAnalyzer } from "@creative-drafter/core";
import type { NotionBrief } from "@creative-drafter/core";

export async function POST(req: NextRequest) {
  try {
    const { brief, previousQuestions, answers } = (await req.json()) as {
      brief: NotionBrief;
      previousQuestions?: string[];
      answers?: string[];
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const analyzer = createAnalyzer(apiKey);

    let result;
    if (previousQuestions?.length && answers?.length) {
      result = await analyzer.refineWithAnswers(
        brief,
        previousQuestions,
        answers
      );
    } else {
      result = await analyzer.analyze(brief);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
