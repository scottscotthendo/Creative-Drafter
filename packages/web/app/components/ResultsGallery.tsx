"use client";

import type { GenerationResult, ModelSelection } from "@creative-drafter/core";

interface Props {
  result: GenerationResult;
  modelSelection: ModelSelection | null;
  promptUsed: string;
}

export function ResultsGallery({ result, modelSelection, promptUsed }: Props) {
  if (result.status === "failed") {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950 p-6">
        <h3 className="font-semibold text-red-300">Generation Failed</h3>
        <p className="mt-2 text-sm text-red-400">
          The model returned an error. Try adjusting your brief or selecting a
          different model.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Generated Drafts
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {result.outputs.map((output, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-zinc-700"
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
              <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-500">
                <span>
                  {output.type === "image" ? "Image" : "Video"}
                  {output.width && output.height
                    ? ` · ${output.width}x${output.height}`
                    : ""}
                </span>
                <a
                  href={output.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation metadata */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Generation Details
        </h3>
        <div className="space-y-2 text-xs text-zinc-400">
          <div>
            <span className="text-zinc-500">Model:</span> {result.modelUsed}
          </div>
          {modelSelection && (
            <div>
              <span className="text-zinc-500">Why this model:</span>{" "}
              {modelSelection.reasoning}
            </div>
          )}
          <div>
            <span className="text-zinc-500">Prompt sent:</span>
            <p className="mt-1 rounded bg-zinc-800 p-2 font-mono text-zinc-300">
              {promptUsed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
