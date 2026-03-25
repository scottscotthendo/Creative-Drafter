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
      <p className="font-pixel text-[9px] text-accent-magenta tracking-widest mb-4">
        CLARIFICATION NEEDED
      </p>

      {analysis && (
        <div className="terminal p-3 mb-4">
          <p className="text-sm text-muted italic">&gt; {analysis}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((question, i) => (
          <div key={i}>
            <label className="block mb-2 text-sm text-text-primary leading-relaxed">
              <span className="font-pixel text-[9px] text-accent-cyan mr-2">
                Q{i + 1}
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
          {submitting ? "ANALYZING..." : "CONTINUE >>"}
        </button>
      </form>
    </div>
  );
}
