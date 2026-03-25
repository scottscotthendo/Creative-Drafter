"use client";

import { useState } from "react";

interface Props {
  questions: string[];
  analysis: string;
  onSubmit: (answers: string[]) => void;
}

export function ClarificationChat({ questions, analysis, onSubmit }: Props) {
  const [answers, setAnswers] = useState<string[]>(
    new Array(questions.length).fill("")
  );
  const [submitting, setSubmitting] = useState(false);

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  }

  return (
    <div className="pixel-card p-6">
      <p className="font-pixel text-[9px] text-retro-magenta tracking-widest mb-4">
        CLARIFICATION NEEDED
      </p>

      {analysis && (
        <div className="mb-4 bg-retro-dark pixel-border p-3">
          <p className="text-sm text-retro-muted font-mono italic">
            &gt; {analysis}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, i) => (
          <div key={i}>
            <label className="block mb-2 text-sm text-retro-text">
              <span className="font-pixel text-[9px] text-retro-cyan mr-2">
                Q{i + 1}
              </span>
              {question}
            </label>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => updateAnswer(i, e.target.value)}
              className="pixel-input"
              placeholder="> your answer..."
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || answers.every((a) => !a.trim())}
          className="pixel-btn"
        >
          {submitting ? "ANALYZING..." : "CONTINUE >>"}
        </button>
      </form>
    </div>
  );
}
