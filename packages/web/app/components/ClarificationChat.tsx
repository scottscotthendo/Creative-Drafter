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
    <div className="card p-6">
      <p className="font-body text-xs font-semibold text-forest uppercase tracking-wide mb-4">
        A few questions
      </p>

      {analysis && (
        <div className="terminal p-3 mb-4">
          <p className="text-sm text-text-muted italic">{analysis}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((question, i) => (
          <div key={i}>
            <label className="block mb-2 text-sm text-text-primary leading-relaxed">
              <span className="font-body text-xs font-semibold text-forest mr-2">
                {i + 1}.
              </span>
              {question}
            </label>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => updateAnswer(i, e.target.value)}
              className="input"
              placeholder="Your answer..."
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || answers.every((a) => !a.trim())}
          className="btn-primary"
        >
          {submitting ? "Analysing..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
