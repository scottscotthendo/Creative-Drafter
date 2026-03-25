"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  NotionBrief,
  StructuredBrief,
  ClarificationResult,
  GenerationResult,
  ModelSelection,
} from "@pixel-pusher/core";
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
  const [error, setError] = useState("");

  // Load brief from sessionStorage
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
      const data = (await res.json()) as ClarificationResult & {
        error?: string;
      };

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
        const flatQuestions = newAllQuestions.flat();
        const flatAnswers = newAllAnswers.flat();

        const res = await fetch("/api/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief,
            previousQuestions: flatQuestions,
            answers: flatAnswers,
          }),
        });
        const data = (await res.json()) as ClarificationResult & {
          error?: string;
        };

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

  async function handleGenerate() {
    if (!structuredBrief) return;
    setStage("generating");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: structuredBrief }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setResult(data.result as GenerationResult);
      setModelSelection(data.modelSelection as ModelSelection);
      setPromptUsed(data.promptUsed as string);
      setStage("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStage("ready");
    }
  }

  if (error && !brief) {
    return (
      <div className="pixel-card p-6 border-retro-red">
        <p className="font-pixel text-[9px] text-retro-red tracking-widest mb-2">
          ERROR
        </p>
        <p className="text-sm text-retro-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brief summary */}
      {brief && <BriefViewer brief={brief} />}

      {/* Error banner */}
      {error && (
        <div className="pixel-card p-4 border-retro-red">
          <p className="font-pixel text-[9px] text-retro-red">ERROR:</p>
          <p className="text-sm text-retro-text mt-1">{error}</p>
        </div>
      )}

      {/* Clarification stage */}
      {stage === "clarifying" && questions.length > 0 && (
        <ClarificationChat
          questions={questions}
          analysis={analysis}
          onSubmit={handleAnswers}
        />
      )}

      {stage === "clarifying" && questions.length === 0 && (
        <div className="text-center">
          <p className="font-pixel text-[10px] text-retro-cyan cursor-blink">
            ANALYZING BRIEF
          </p>
        </div>
      )}

      {/* Ready to generate */}
      {stage === "ready" && structuredBrief && (
        <div className="space-y-6">
          <ModelRecommendation brief={structuredBrief} />
          <div className="flex justify-center">
            <button onClick={handleGenerate} className="pixel-btn">
              PUSH PIXELS
            </button>
          </div>
        </div>
      )}

      {/* Generating */}
      {stage === "generating" && (
        <div className="text-center py-8">
          <p className="font-pixel text-sm text-retro-cyan animate-pulse">
            PUSHING PIXELS...
          </p>
          <p className="font-mono text-xs text-retro-muted mt-3">
            Crafting prompt & generating assets
          </p>
        </div>
      )}

      {/* Results */}
      {stage === "complete" && result && (
        <ResultsGallery
          result={result}
          modelSelection={modelSelection}
          promptUsed={promptUsed}
        />
      )}
    </div>
  );
}
