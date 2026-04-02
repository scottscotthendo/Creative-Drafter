"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  NotionBrief,
  StructuredBrief,
  ClarificationResult,
  GenerationResult,
  ModelSelection,
} from "@heidi/core/client";
import { BriefViewer } from "../components/BriefViewer";
import { ClarificationChat } from "../components/ClarificationChat";
import { ModelRecommendation } from "../components/ModelRecommendation";
import { ResultsGallery } from "../components/ResultsGallery";

type Stage = "loading" | "clarifying" | "ready" | "generating" | "complete";

export default function DraftPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [brief, setBrief] = useState<NotionBrief | null>(null);
  const [structuredBrief, setStructuredBrief] = useState<StructuredBrief | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<string[][]>([]);
  const [allQuestions, setAllQuestions] = useState<string[][]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [modelSelection, setModelSelection] = useState<ModelSelection | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [iteration, setIteration] = useState<{ previousPrompt: string; feedback: string } | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("brief");
    if (!stored) {
      setError("No brief loaded. Go back and paste a Notion URL.");
      return;
    }
    const parsed = JSON.parse(stored) as NotionBrief;
    setBrief(parsed);
    startClarification(parsed);
  }, []);

  async function startClarification(notionBrief: NotionBrief) {
    setStage("clarifying");
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: notionBrief }),
      });
      const data = (await res.json()) as ClarificationResult & { error?: string };
      if (data.error) throw new Error(data.error);
      if (data.complete && data.brief) {
        setStructuredBrief(data.brief);
        setStage("ready");
      } else {
        setQuestions(data.questions || []);
        setAnalysis(data.analysis || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clarification failed");
    }
  }

  const handleAnswers = useCallback(
    async (answers: string[]) => {
      if (!brief) return;
      const newAllQuestions = [...allQuestions, questions];
      const newAllAnswers = [...allAnswers, answers];
      setAllQuestions(newAllQuestions);
      setAllAnswers(newAllAnswers);
      try {
        const res = await fetch("/api/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief,
            previousQuestions: newAllQuestions.flat(),
            answers: newAllAnswers.flat(),
          }),
        });
        const data = (await res.json()) as ClarificationResult & { error?: string };
        if (data.error) throw new Error(data.error);
        if (data.complete && data.brief) {
          setStructuredBrief(data.brief);
          setStage("ready");
        } else {
          setQuestions(data.questions || []);
          setAnalysis(data.analysis || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Clarification failed");
      }
    },
    [brief, questions, allQuestions, allAnswers]
  );

  async function handleGenerate(feedbackIteration?: { previousPrompt: string; feedback: string }) {
    if (!structuredBrief) return;
    setStage("generating");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: structuredBrief,
          iteration: feedbackIteration,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result as GenerationResult);
      setModelSelection(data.modelSelection as ModelSelection);
      setPromptUsed(data.promptUsed as string);
      setStage("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStage(feedbackIteration ? "complete" : "ready");
    }
  }

  function handleFeedback(feedback: string) {
    const nextIteration = { previousPrompt: promptUsed, feedback };
    setIteration(nextIteration);
    setAttempt((a) => a + 1);
    handleGenerate(nextIteration);
  }

  if (error && !brief) {
    return (
      <div className="card p-6 border-status-error/30">
        <p className="font-body text-sm font-semibold text-status-error mb-2">
          Something went wrong
        </p>
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {brief && <BriefViewer brief={brief} />}

      {error && (
        <div className="card p-4 border-status-error/30">
          <p className="font-body text-sm font-semibold text-status-error">
            Something went wrong
          </p>
          <p className="text-sm text-text-secondary mt-1">{error}</p>
        </div>
      )}

      {stage === "clarifying" && questions.length > 0 && (
        <ClarificationChat
          questions={questions}
          analysis={analysis}
          onSubmit={handleAnswers}
        />
      )}

      {stage === "clarifying" && questions.length === 0 && (
        <div className="text-center py-6">
          <p className="font-body text-sm text-text-secondary">
            Analysing your brief...
          </p>
        </div>
      )}

      {stage === "ready" && structuredBrief && (
        <div className="space-y-6">
          <ModelRecommendation brief={structuredBrief} />
          <div className="flex justify-center">
            <button onClick={() => handleGenerate()} className="btn-primary">
              Generate drafts
            </button>
          </div>
        </div>
      )}

      {stage === "generating" && (
        <div className="text-center py-10">
          <div className="inline-block rounded-card p-6">
            <p className="font-display text-xl font-semibold text-bark">
              {attempt > 1 ? "Regenerating with your feedback..." : "Generating your drafts..."}
            </p>
          </div>
          <p className="font-body text-sm text-text-muted mt-4">
            Crafting prompts and generating assets — this may take a moment.
          </p>
        </div>
      )}

      {stage === "complete" && result && (
        <ResultsGallery
          result={result}
          modelSelection={modelSelection}
          promptUsed={promptUsed}
          attempt={attempt}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}
