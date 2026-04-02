"use client";

import { useState } from "react";
import type { GenerationResult, ModelSelection } from "@heidi/core/client";

interface Props {
  result: GenerationResult;
  modelSelection: ModelSelection | null;
  promptUsed: string;
  attempt: number;
  onFeedback: (feedback: string) => void;
}

export function ResultsGallery({ result, modelSelection, promptUsed, attempt, onFeedback }: Props) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    onFeedback(feedback.trim());
    setFeedback("");
    setSubmitting(false);
  }

  if (result.status === "failed") {
    return (
      <div className="card p-6 border-status-error/30">
        <p className="font-body text-sm font-semibold text-status-error mb-2">
          Generation failed
        </p>
        <p className="text-sm text-text-secondary">
          The model returned an error. Try adjusting your brief or selecting a
          different model.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-body text-xs font-semibold text-forest uppercase tracking-wide">
            Drafts ready
          </p>
          {attempt > 1 && (
            <span className="tag">Version {attempt}</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {result.outputs.map((output, i) => (
            <div
              key={i}
              className="rounded-btn overflow-hidden border border-surface-3 bg-surface-1"
            >
              {output.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={output.url}
                  alt={`Draft ${i + 1}`}
                  className="w-full"
                />
              ) : (
                <video
                  src={output.url}
                  controls
                  className="w-full"
                  playsInline
                />
              )}
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-surface-3">
                <span className="font-body text-xs text-text-muted">
                  {output.type === "image" ? "Image" : "Video"}
                  {output.width && output.height
                    ? ` · ${output.width}×${output.height}`
                    : ""}
                </span>
                <a
                  href={output.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-xs text-forest hover:text-bark transition-colors"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-surface-3">
          <p className="font-body text-sm font-semibold text-bark mb-3">
            Not quite right? Describe what to change.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. warmer lighting, more close-up, use the Sunlight yellow more prominently..."
            rows={2}
            className="input resize-none"
          />
          <div className="flex gap-3 mt-3">
            <button
              type="submit"
              disabled={submitting || !feedback.trim()}
              className="btn-primary"
            >
              {submitting ? "Regenerating..." : "↺ Try again"}
            </button>
            <p className="text-xs text-text-muted self-center">
              Keeps what worked, changes what didn&apos;t
            </p>
          </div>
        </form>
      </div>

      {/* Generation details */}
      <div className="card p-6">
        <p className="font-body text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">
          Generation details
        </p>
        <div className="terminal p-4 space-y-3 text-sm">
          <div>
            <span className="text-text-muted">Model</span>{" "}
            <span className="text-text-secondary">{result.modelUsed}</span>
          </div>
          {modelSelection && (
            <div>
              <span className="text-text-muted">Reason</span>{" "}
              <span className="text-text-secondary">{modelSelection.reasoning}</span>
            </div>
          )}
          <div>
            <span className="text-text-muted">Prompt</span>
            <p className="mt-1.5 text-text-secondary pl-3 border-l-2 border-surface-3 leading-relaxed">
              {promptUsed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
