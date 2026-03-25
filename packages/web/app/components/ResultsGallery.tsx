"use client";

import type { GenerationResult, ModelSelection } from "@pixel-pusher/core";

interface Props {
  result: GenerationResult;
  modelSelection: ModelSelection | null;
  promptUsed: string;
}

export function ResultsGallery({ result, modelSelection, promptUsed }: Props) {
  if (result.status === "failed") {
    return (
      <div className="pixel-card p-6 border-retro-red">
        <p className="font-pixel text-[9px] text-retro-red tracking-widest mb-2">
          GENERATION FAILED
        </p>
        <p className="text-sm text-retro-text">
          The model returned an error. Try adjusting your brief or selecting a
          different model.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results */}
      <div className="pixel-card p-6">
        <p className="font-pixel text-[9px] text-retro-green tracking-widest mb-4">
          GENERATION COMPLETE
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {result.outputs.map((output, i) => (
            <div key={i} className="pixel-border overflow-hidden bg-retro-dark">
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
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-pixel text-[8px] text-retro-muted">
                  {output.type === "image" ? "[IMG]" : "[VID]"}
                  {output.width && output.height
                    ? ` ${output.width}x${output.height}`
                    : ""}
                </span>
                <a
                  href={output.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel text-[8px] text-retro-cyan hover:text-retro-green"
                >
                  [DOWNLOAD]
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="pixel-card p-6">
        <p className="font-pixel text-[9px] text-retro-muted tracking-widest mb-3">
          GENERATION LOG
        </p>
        <div className="space-y-2 font-mono text-xs bg-retro-dark pixel-border p-4">
          <div>
            <span className="text-retro-cyan">MODEL:</span>{" "}
            <span className="text-retro-text">{result.modelUsed}</span>
          </div>
          {modelSelection && (
            <div>
              <span className="text-retro-cyan">REASON:</span>{" "}
              <span className="text-retro-muted">
                {modelSelection.reasoning}
              </span>
            </div>
          )}
          <div>
            <span className="text-retro-cyan">PROMPT:</span>
            <p className="mt-1 text-retro-green opacity-80 pl-2 border-l-2 border-retro-border">
              {promptUsed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
