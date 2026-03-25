"use client";

import type { GenerationResult, ModelSelection } from "@pixel-pusher/core/client";

interface Props {
  result: GenerationResult;
  modelSelection: ModelSelection | null;
  promptUsed: string;
}

export function ResultsGallery({ result, modelSelection, promptUsed }: Props) {
  if (result.status === "failed") {
    return (
      <div className="card p-6 !border-accent-red/30">
        <p className="font-pixel text-[9px] text-accent-red tracking-widest mb-2">
          GENERATION FAILED
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
        <p className="font-pixel text-[9px] text-accent-green tracking-widest mb-5">
          GENERATION COMPLETE
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {result.outputs.map((output, i) => (
            <div
              key={i}
              className="rounded-btn overflow-hidden border border-surface-4 bg-surface-1"
            >
              {output.type === "image" ? (
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
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-surface-4">
                <span className="font-pixel text-[8px] text-muted">
                  {output.type === "image" ? "[img]" : "[vid]"}
                  {output.width && output.height
                    ? ` ${output.width}x${output.height}`
                    : ""}
                </span>
                <a
                  href={output.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel text-[8px] text-accent-cyan hover:text-accent-green transition-colors"
                >
                  download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation log */}
      <div className="card p-6">
        <p className="font-pixel text-[9px] text-muted tracking-widest mb-4">
          GENERATION LOG
        </p>
        <div className="terminal p-4 space-y-3">
          <div>
            <span className="text-accent-cyan/60">model</span>{" "}
            <span className="text-text-secondary">{result.modelUsed}</span>
          </div>
          {modelSelection && (
            <div>
              <span className="text-accent-cyan/60">reason</span>{" "}
              <span className="text-muted">{modelSelection.reasoning}</span>
            </div>
          )}
          <div>
            <span className="text-accent-cyan/60">prompt</span>
            <p className="mt-1.5 text-accent-green/70 pl-3 border-l-2 border-surface-4 leading-relaxed">
              {promptUsed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
