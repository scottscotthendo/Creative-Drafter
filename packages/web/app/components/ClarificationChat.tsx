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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      {analysis && (
        <p className="mb-4 text-sm text-zinc-400 italic">{analysis}</p>
      )}

      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        A few questions to nail the brief:
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, i) => (
          <div key={i}>
            <label className="mb-1.5 block text-sm text-zinc-300">
              {question}
            </label>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => updateAnswer(i, e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              placeholder="Your answer..."
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || answers.every((a) => !a.trim())}
          className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Analyzing..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
